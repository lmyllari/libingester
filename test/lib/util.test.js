'use strict';

const expect = require('chai').expect;
const fs = require('fs');

const util = require('../../lib/util');

describe('encode_uri', function() {
    it('encodes URIs correctly', function() {
        // Normal URIs aren't touched.
        expect(util.encode_uri(
            'https://en.wikipedia.org/wiki/Abraham_Lincoln')).to.equal(
            'https://en.wikipedia.org/wiki/Abraham_Lincoln');

        expect(util.encode_uri(
            'https://en.wikipedia.org/w/api.php?action=query&titles=Abraham_Lincoln')).to.equal(
            'https://en.wikipedia.org/w/api.php?action=query&titles=Abraham_Lincoln');

        // Percent-encoded URIs aren't touched.
        expect(util.encode_uri(
            'https://en.wikipedia.org/w/api.php?action=query&titles=Abraham%20Lincoln')).to.equal(
            'https://en.wikipedia.org/w/api.php?action=query&titles=Abraham%20Lincoln');

        // Unicode URIs are encoded properly.
        expect(util.encode_uri(
            'https://en.wikipedia.org/wiki/Merkle–Damgård_construction')).to.equal(
            'https://en.wikipedia.org/wiki/Merkle%E2%80%93Damg%C3%A5rd_construction');

        // Check that we punycode URIs.
        expect(util.encode_uri(
            'http://☃.com/foo.png')).to.equal(
            'http://xn--n3h.com/foo.png');

        // Ensure we can handle file:/// URIs and URIs with empty netlocs.
        expect(util.encode_uri('file:///foo/bar')).to.equal('file:///foo/bar');
        expect(util.encode_uri('file://./foo/bar')).to.equal('file://./foo/bar');
    });
});

describe('download_image', function() {
    it('can handle downloading a regular src image', function() {
        let image_tag = "<img src=\"https://endlessos.com/wp-content/uploads/2016/05/Home_Video@2x.jpg\">test</img>";

        const asset = util.download_img(image_tag, '');
        expect(asset.asset_id).is.not.null;
        expect(asset.asset_id).is.not.undefined;
        expect(asset.to_data()).is.not.null;
    });

    describe('data urls', function() {
        it('can handle png urls correctly', function() {
            const imageUrlFile = fs.readFileSync(__dirname + '/test_files/base64_encoded_image.png.txt');
            const image = fs.readFileSync(__dirname + '/test_files/base64_encoded_image.png');
            const imageSha256Hash = 'e7f555cc474b1d12a52cb9b9fa012a3502e8a2d972e19d49a898629937ac13ca'

            // We want this as a string
            let imageUrl = imageUrlFile.toString();

            if (imageUrl == undefined || imageUrl.length <= 0 ||
                image == undefined || image.length <= 0) {
              throw new Error("Invalid data loaded from test image");
            }

            const imageTag = "<img src=" + imageUrl + ">test</img>";

            const asset = util.download_img(imageTag, 'a://b.com/c d.html');
            expect(asset.asset_id).is.not.null;
            expect(asset.asset_id).is.not.undefined;
            expect(asset.to_data()).to.deep.equal(image);

            const metadata = asset.to_metadata();
            expect(metadata.contentType).to.equal('image/png');
            expect(metadata.canonicalURI).to.equal("data:image/png;" +
                                                   "uri=a://b.com/c%20d.html;" +
                                                   `sha256=${imageSha256Hash};`);
        });

        it('can handle jpeg urls correctly', function() {
            const imageUrlFile = fs.readFileSync(__dirname + '/test_files/base64_encoded_image.jpeg.txt');
            const image = fs.readFileSync(__dirname + '/test_files/base64_encoded_image.jpeg');
            const imageSha256Hash = '1bc8db1d29ab4d12a8d4296de97ec0b26aa6f666a8e12bc9ff78016274120363'

            // We want this as a string
            let imageUrl = imageUrlFile.toString();

            if (imageUrl == undefined || imageUrl.length <= 0 ||
                image == undefined || image.length <= 0) {
              throw new Error("Invalid data loaded from test image");
            }

            const imageTag = "<img src=" + imageUrl + ">test</img>";

            const asset = util.download_img(imageTag, 'a://b.com/c d.html');
            expect(asset.asset_id).is.not.null;
            expect(asset.asset_id).is.not.undefined;
            expect(asset.to_data()).to.deep.equal(image);

            const metadata = asset.to_metadata();
            expect(metadata.contentType).to.equal('image/jpeg');
            expect(metadata.canonicalURI).to.equal("data:image/jpeg;" +
                                                   "uri=a://b.com/c%20d.html;" +
                                                   `sha256=${imageSha256Hash};`);
        });
    });
});

describe('fetch_html', function() {
    it('can handle gzipped responses', function(done) {
        const test_url = 'https://www.kapanlagi.com/' +
                        'intermezzone/' +
                        'bule-amerika-ini-nyoba-makan-buah-duku-ekspresinya-nggak-nahan-aee243.html';
        const doctype = '<!DOCTYPE html>';
        util.fetch_html(test_url).then((result) => {
            expect(result.html().substring(0, doctype.length)).to.equal(doctype);
            done();
        })
        .catch(done);
    });
});
