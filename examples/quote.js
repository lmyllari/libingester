'use strict';

const libingester = require('libingester');
const mustache = require('mustache');
const rp = require('request-promise');
const template = require('./template_quote');
const url = require('url');

const home_page = 'http://www.thefreedictionary.com/_/archive.htm'; // Home section


function ingest_article_profile(hatch, uri) {
    return libingester.util.fetch_html(uri).then(($profile) => {
        const base_uri = libingester.util.get_doc_base_uri($profile, uri);
        const asset = new libingester.NewsArticle();

        asset.set_canonical_uri(uri);

        // use url library to pull out query string date object
        const parts = url.parse(uri, true);
        const modified_date = new Date(Date.parse(parts.query.d));

        asset.set_last_modified_date(modified_date);
        asset.set_section("Article");

        //Set title section
        const date = parts.query.d;
        const title = $profile('h1').first().text() + ": " + date;

        asset.set_title(title);

        // Pluck wordOfDay
        const wordOfDay = $profile('table.widget', 'div#colleft').first().find('h3').children().text();

        // Pluck wordOfDayDef
        const wordOfDayMixedString = $profile('td:contains("Definition:")').next().text();
        const wordOfDayDef = wordOfDayMixedString.split(" ").slice(1).join(" ");

        // Pluck wordOfDayType
        const pos = wordOfDayMixedString.split(" ")[0];
        const wordOfDayType = pos.substr(1, pos.length-2);

        // Pluck quoteText
        const quoteText = $profile('table.widget', 'div#colleft').last().find('span').text();

        // Pluck quoteAuthor
        const quoteAuthor = $profile('table.widget', 'div#colleft').last().find('p').text();

        // Pluck dayInHistoryYearFinal
        const dayInHistoryBlob = $profile('tr:contains("This Day in History")').next().text();
        if(dayInHistoryBlob == "undefined"){
          let dayInHistoryBlob = "";
        }
        const reHistory = /\(([0-9]){4}\)/g;
        console.log("dayInHistoryBlob: " + dayInHistoryBlob + " date: " + date);

        const dayInHistoryYear = reHistory.exec(dayInHistoryBlob)[0];
        const dayInHistoryYearFinal = dayInHistoryYear.slice(1,5);

        // Pluck dayInHistoryHead
        const dayInHistoryHead = dayInHistoryBlob.split(dayInHistoryYear)[0];

        // Pluck dayInHistoryBody
        let dayInHistoryBody = dayInHistoryBlob.split(dayInHistoryYear)[1];
        dayInHistoryBody = dayInHistoryBody.split("\tMore...")[0];

        // Pluck todaysHolidayYearFinal
        const todaysHolidayBlob = $profile('tr:contains("This Day in History")').next().text();
        const reHoliday = /\(([0-9]){4}\)/g;
        const todaysHolidayYear = reHoliday.exec(todaysHolidayBlob)[0];
        const todaysHolidayYearFinal = todaysHolidayYear.slice(1,5);

        // Pluck todaysHolidayHead and todaysHolidayBody
        const todaysHolidayHead = todaysHolidayBlob.split(todaysHolidayYear)[0];
        let todaysHolidayBody = todaysHolidayBlob.split(todaysHolidayYear)[1];
        todaysHolidayBody = todaysHolidayBody.split("\tMore...")[0];

        const dataObject = {

        }

        const content = mustache.render(template.structure_template, {
            title: title,
            date: date,

            wordOfDay: wordOfDay,
            wordOfDayType: wordOfDayType,
            wordOfDayDef: wordOfDayDef,

            quoteText: quoteText,
            quoteAuthor: quoteAuthor,

            dayInHistoryHead: dayInHistoryHead,
            dayInHistoryBody: dayInHistoryBody,
            dayInHistoryYear: dayInHistoryYearFinal,

            todaysHolidayHead: todaysHolidayHead,
            todaysHolidayYear: todaysHolidayYearFinal

        });
        asset.set_document(content);
        hatch.save_asset(asset);
    });
}

function main() {
    const hatch = new libingester.Hatch();
    // make request to the index (home) page
    libingester.util.fetch_html(home_page).then(($pages) => {
        // retrieve all the URLs for individual pages
        const articles_links = $pages('#Calendar div:nth-child(-2n+2) a').map(function() {
            const uri = $pages(this).attr('href');
            return url.resolve(home_page, uri);
        }).get();

        Promise.all(articles_links.map((uri) => ingest_article_profile(hatch, uri)))
        .catch(err => console.log(err.stack)).then(() => {
            return hatch.finish();
        });
    });
}

main();
