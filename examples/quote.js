'use strict';

const libingester = require('libingester');
const mustache = require('mustache');
const rp = require('request-promise');
const template = require('./template');
const url = require('url');

const home_page = 'http://www.thefreedictionary.com/_/archive.htm'; // Home section

//Remove elements
const remove_elements = [
    'form', //Newsletter
    'ins', //Ads
    'noscript', //any script injection
    'script', //any script injection
    '.addthis_responsive_sharing', //sharing buttons
    '.code-block', //recomendation links
    '.embed-block-wrapper', //Image wrapper
    '.fb-comments', //comments
    '.image-block-outer-wrapper', //Image wrapper
    '.intrinsic',
    '.newsletter-form-field-wrapper', //Newsletter
    '.newsletter-form-header-title', //Newsletter
    '.newsletter-form-wrapper', //Newsletter
    '.sqs-block-code', // Ads
    '#taboola-below-article-thumbnails', //Related articles
];

const remove_metadata = [
    'data-image',
    'data-image-id',
    'data-src',
    'href',
    'src',
];

function ingest_article_profile(hatch, uri) {
    return libingester.util.fetch_html(uri).then(($profile) => {
        const base_uri = libingester.util.get_doc_base_uri($profile, uri);
        const asset = new libingester.NewsArticle();

        asset.set_canonical_uri(uri);
        // Pull out the updated date

          // from wowshack:
        // const modified_date = new Date(Date.parse($profile('.date time').attr('datetime')));

        // use url library to pull out query string date object
        const parts = url.parse(uri, true);
        const modified_date = new Date(Date.parse(parts.query.d));

        asset.set_last_modified_date(modified_date);
        asset.set_section("Article");

        //Set title section
        const title = $profile('h1').first().text();
        const date = parts.query.d;

          //from wowshack:
        // const title = $profile('meta[property="og:title"]').attr('content');
        // const date = $profile('.date time').first().text();
        asset.set_title(title);

        // Pluck wordOfDay
        const wordOfDay = $profile('table.widget', 'div#colleft').first().find('h3').children().text();

        // Pluck wordDefinition
        const mixedString = $profile('td:contains("Definition:")').next().text();
        const wordDefinition = mixedString.split(" ").slice(1).join(" ");

        // Pluck partOfSpeech
        const pos = mixedString.split(" ")[0];
        const partOfSpeech = pos.substr(1, pos.length-2);

        // Pluck quoteText
        const quoteText = $profile('table.widget', 'div#colleft').last().find('span').text();

        // Pluck quoteAuthor
        const quoteAuthor = $profile('table.widget', 'div#colleft').last().find('p').text();

        // Pluck dayInHistoryYearFinal
        const dayInHistoryBlob = $profile('tr:contains("This Day in History")').next().text();
        const re = /\(([0-9]){4}\)/g;
        const dayInHistoryYear = re.exec(dayInHistoryBlob)[0];
        const dayInHistoryYearFinal = dayInHistoryYear.slice(1,5);

        // Pluck dayInHistoryHead
        const dayInHistoryHead = dayInHistoryBlob.split(dayInHistoryYear)[0];

        // Pluck dayInHistoryBody
        let dayInHistoryBody = dayInHistoryBlob.split(dayInHistoryYear)[1];
        dayInHistoryBody = dayInHistoryBody.split("\tMore...")[0];



        // //Delete image wrapper
        // $profile('.image-block-outer-wrapper').map(function() {
        //     const parent = $profile(this);
        //     parent.find("img.thumb-image, .image-caption").map(function() {
        //         const child = $profile(this);
        //         parent.before(child);
        //     });
        // });

        //remove elements
        const layout = $profile('#canvas').first();
        for (const remove_element of remove_elements) {
            layout.find(remove_element).remove();
        }

        let article_content = $profile('.sqs-block-content');
        //cleaning html use p in paragraphs
        article_content.find("h3").map(function() {
            this.name = "p";
        });

        // THIS IS UNNECESSARY AS WE AREN'T DOWNLOADING IMAGES OR VIDEOS
        // //Download images
        // article_content.find("img").map(function() {
        //     if (this.attribs.src == undefined) {
        //         this.attribs.src = this.attribs['data-src'];
        //     }
        //     const image = libingester.util.download_img(this, base_uri);
        //     hatch.save_asset(image);
        //     this.attribs["data-libingester-asset-id"] = image.asset_id;
        //     for (const meta of remove_metadata) {
        //         delete this.attribs[meta];
        //     }
        // });
        //
        // //Download videos
        // const videos = $profile(".sqs-block-video").map(function() {
        //     const json_video_info = JSON.parse(this.attribs["data-block-json"]);
        //     if (json_video_info.url != undefined) {
        //         const video_asset = new libingester.VideoAsset();
        //         video_asset.set_canonical_uri(uri);
        //         video_asset.set_last_modified_date(modified_date);
        //         video_asset.set_title(title);
        //         video_asset.set_download_uri(json_video_info.url);
        //         hatch.save_asset(video_asset);
        //     }
        // });

        const body = article_content.map(function() {
            return $profile(this).html();
        }).get();

        const content = mustache.render(template.structure_template, {
            title: title,
            date: date,
            html: body.join(''),
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
        const articles_links = $pages('#Calendar a:nth-child(-n + 200)').map(function() {
            const uri = $pages(this).attr('href');
            // resolve URI with main URL
            return url.resolve(home_page, uri);
        }).get();
        // const articles_links = $pages('#page a.project:nth-child(-n + 30)').map(function() {
        //     const uri = $pages(this).attr('href');
        //     // resolve URI with main URL
        //     return url.resolve(home_page, uri);
        // }).get();

        Promise.all(articles_links.map((uri) => ingest_article_profile(hatch, uri))).then(() => {
            return hatch.finish();
        });
    });
}

main();
