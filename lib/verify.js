'use strict';

class VerificationError extends Error {
}

function assert(value, message) {
    if (!value)
        throw new VerificationError(message);
}

function verify_metadata(metadata) {
    let object_type = metadata['objectType'];

    assert((metadata['assetID'].length === 40), "Asset has invalid assetID");
    assert(typeof metadata['canonicalURI'] === "string", "Asset has invalid canonicalURI");
    assert(typeof metadata['contentType'] === "string", "Asset has invalid contentType");

    assert(!!metadata['matchingLinks'], "Asset missing matchingLinks");
    assert(metadata['matchingLinks'].every((s) => (typeof s === "string")), "Some asset matching URIs are not strings");

    assert(!!metadata['tags'], "Asset missing tags");
    assert(metadata['tags'].every((s) => (typeof s === "string")), "Some asset tags are not strings");

    assert(!!metadata['lastModifiedDate'], "Asset missing lastModifiedDate");
    assert(!!metadata['revisionTag'], "Asset missing revisionTag");

    if (object_type === 'ArticleObject') {
        // XXX: This should be really attached to stuff that can show up in sets / search
        assert(!!metadata['title'], "metadata missing title");
        assert(!!metadata['document'], "metadata missing document");
    } else if (object_type === 'ImageObject') {
        assert(!!metadata['cdnFilename'], "Image object missing cdnFilename (has no data?)");
    } else {
        throw new VerificationError("metadata has wrong objectType");
    }
}

exports.verify_metadata = verify_metadata;
