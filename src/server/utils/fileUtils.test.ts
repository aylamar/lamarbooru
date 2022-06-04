import {
    generateTagConnectQuery,
    generateFileName,
    getExtensionFromMimeType,
    getFileHash,
    getNamespace,
    getRating,
    isValidExtension,
    isValidMimeType
} from "./fileUtils";
import fs from "fs";


describe('ImageUtils', () => {
    test('should validate mimetypes', async () => {
        expect(await isValidMimeType('image/png')).toBe(true);
        expect(await isValidMimeType('image/jpeg')).toBe(true);
        expect(await isValidMimeType('image/gif')).toBe(false);
        expect(await isValidMimeType('image/svg+xml')).toBe(false);
    });

    it('should validate extensions', async () => {
        expect(await isValidExtension('png')).toBe(true);
        expect(await isValidExtension('jpeg')).toBe(true);
        expect(await isValidExtension('gif')).toBe(false);
        expect(await isValidExtension('svg+xml')).toBe(false);
    });

    it('should get the correct file extensions', async () => {
        expect(await getExtensionFromMimeType('image/png')).toBe('png');
        expect(await getExtensionFromMimeType('image/jpeg')).toBe('jpeg');
        expect(await getExtensionFromMimeType('image/gif')).toBe('gif');
        expect(await getExtensionFromMimeType('xml')).toBe('xml');
    });


    it('should generate a uuid filename', async () => {
        expect(await generateFileName('png')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
    });

    it('should generate a connect query', async () => {
        expect(await generateTagConnectQuery(['1girl', 'creator:test_creator', 'series:test_series', 'character:test_character', 'meta:absurdres'])).toStrictEqual([
            {
                "create": {
                    "namespace": "tag",
                    "tag": "1girl"
                },
                "where": {
                    "tag_namespace": {
                        "namespace": "tag",
                        "tag": "1girl"
                    }
                }
            },
            {
                "create": {
                    "namespace": "creator",
                    "tag": "test_creator"
                },
                "where": {
                    "tag_namespace": {
                        "namespace": "creator",
                        "tag": "test_creator"
                    }
                }
            },
            {
                "create": {
                    "namespace": "series",
                    "tag": "test_series"
                },
                "where": {
                    "tag_namespace": {
                        "namespace": "series",
                        "tag": "test_series"
                    }
                }
            },
            {
                "create": {
                    "namespace": "character",
                    "tag": "test_character"
                },
                "where": {
                    "tag_namespace": {
                        "namespace": "character",
                        "tag": "test_character"
                    }
                }
            },
            {
                "create": {
                    "namespace": "meta",
                    "tag": "absurdres"
                },
                "where": {
                    "tag_namespace": {
                        "namespace": "meta",
                        "tag": "absurdres"
                    }
                }
            }
        ]);
    })

    it('should generate a file hash', async () => {
        expect(await getFileHash(fs.readFileSync('./test_data/test-img-1.jpg'))).toMatch('487827c69adb5498650e25a8602cb4f1');
        expect(await getFileHash(fs.readFileSync('./test_data/test-img-2.jpg'))).toMatch('b458754391d311590c649caad1f6ca2d');
    });

    it('should return valid namespaces', async () => {
        expect(await getNamespace('test_tag')).toBe('tag');
        expect(await getNamespace('creator:yomu')).toBe('creator');
        expect(await getNamespace('series:kanojo_okarishimasu')).toBe('series');
        expect(await getNamespace('meta:absurdres')).toBe('meta');
        expect(await getNamespace('character:mizuhara_chizuru')).toBe('character');
    });

    it('should generate correct ratings', async () => {
        expect(await getRating('safe')).toBe('safe');
        expect(await getRating('questionable')).toBe('questionable');
        expect(await getRating('explicit')).toBe('explicit');
    })
})