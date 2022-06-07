# API Routes

## File Routes

### GET `/api/file/:id`

_Get file by id._

Parameters:

* `id`: The numerical ID of the file to fetch.

```json title="Successful Reponse (200)"
{
    "id": 1,
    "createdAt": "2022-05-30T15:52:35.297Z",
    "updatedAt": "2022-05-30T15:52:35.298Z",
    "filename": "c3bb72a9-4cbe-4872-b7b2-bf9e27bfa3e8.jpeg",
    "hash": "85747e8865a35c3f44a1e5596b36f79d",
    "status": "inbox",
    "rating": "safe",
    "source": {
        "id": "86739154-6dd0-4e94-b8a8-b623c313228d",
        "site": "danbooru",
        "url": "https://www.example.com/image.jpeg",
        "status": "downloaded"
    }
    "tags": [
        {
            "id": 1,
            "tag": "1girl",
            "namespace": "tag",
            "_count": {
                "files": 5
            }
        },
        {
            "id": 2,
            "tag": "absurdres",
            "namespace": "meta",
            "_count": {
                "files": 4
            }
        }
    ]
}
```

Unsuccessful response codes:

* 404: File not found.

### POST `/api/file`

_Add a new file to the database._

Arguments:

* `file`: (required) The file to upload.
* `tags`:  (required) Array of strings containing tags.
* `rating`: (optional) The rating of the file (must be safe, questionable, or explicit), defaults to explicit.
* `source`: (optional) Sources of file in an array of strings.

```json title="Example request body"
{
    "tags": ["meta:absurdres", "1girl", "creator:yom"],
    "source": ["https://www.example.com/image.jpeg"],
    "rating": "safe",
}
```

```json title="Successful Reponse (201)"
{
    "id": 1,
    ... full file data ...
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid file type.
* 303: File already exists.

```json title="Unsuccessful Response (303)"
{
    "error": "File already exists",
    file: {
        ... file data of matching file ...
    }
}
```

### PUT `/api/file/:id`

_Update the data on the file._

Parameters:

* `id`: The numerical ID of the file to update.

Arguments:

* `tags`:  (required) Array of strings containing tags.
* `rating`: (optional) The rating of the file (must be safe, questionable, or explicit).
* `source`: (optional) Sources of file in an array of strings.

```json title="Example request body"
{
    "tags": [
        "creator:yomu",
        "meta:absurdres",
        "1girl",
        "1boy"
    ],
    "source": [
        "https://www.example.com/example.jpg"
    ],
    "rating": "safe" 
}
```

```json title="Successful Reponse (200)"
{
    "id": 1,
    ... full file data with changes ...
    ]
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No file found with that id.
* 500: Database error while updating file.

### POST `/api/file/booru`

_Add a new file to the database using data from a booru._

Arguments:

* `url`: (required) The url of the file to upload.

```json title="Successful Reponse (201)"
{
    "id": 1,
    ... full file data ...
}
```


### GET `/api/file/search/:page`

_Get a page of 32 files using, optionally filtered by tag_

Parameters:

* `page`: (required) The page number, must one or greater.
* `tags`: (optional) The tag to filter by, any number of tags are supported and should be seperated by a space of a "+".

```json title="Successful Reponse (200)"
[
    {
        "id": 5,
        ... full file data ...
     },
     {
        "id": 4,
        ... full file data ...
     },
     ... etc ...
]
```

### GET `/api/file/tags/:tag`

_Get all tags that start with the :tag parameter_

Parameters:

* `tag`: (required) Tag to search for.

```json title="Successful Reponse (200)"
[
    {
        "id": 4,
        "tag": "1girl",
        "namespace": "tag"
    },
    {
        "id": 1389,
        "tag": "1boy",
        "namespace": "tag"
    }
]
```


Unsuccessful response codes:

* 404: No tags found with the parameters provided.

## Subscription Routes

### GET `/api/subscription`

_Get a list of all subscriptions._

```json title="Successful Reponse (200)"
[
    {
        "id": 2,
        "createdAt": "2022-06-05T02:59:46.851Z",
        "updatedAt": "2022-06-05T03:00:51.360Z",
        "site": "danbooru",
        "tags": [
            "1girl"
        ],
        "tagBlacklist": [],
        "limit": 500,
        "status": "finished",
        "interval": "daily",
        "nextRun": "2022-06-06T03:00:42.543Z",
        "_count": {
            "runs": 5,
        }
    },
    {
        "id": 1,
        "createdAt": "2022-06-05T02:08:40.361Z",
        "updatedAt": "2022-06-05T02:20:06.852Z",
        "site": "danbooru",
        "tags": [
            "mizuhara_chizuru"
        ],
        "tagBlacklist": ["comic"],
        "limit": 200,
        "status": "finished",
        "interval": "daily",
        "nextRun": "2022-06-06T02:17:44.655Z",
        "_count": {
            "runs": 1
        }
    }
]
```

### POST `/api/subscription`

_Create a new subscription._

Parameters:

* `site`: (required) `danbooru`.
* `tags`: (required) Array of strings containing tags to search.
* `interval`: (required) `daily`, `weekly`, or `monthly`.
* `tagBlacklist`: (optional) Array of strings containing tags of images to skip.

```json title="Example request body"
{
    "site": "danbooru",
    "tags": ["mizuha_chizuru"],
    "tagBlacklist": ["comic"],
    "interval": "daily"
}```


```json title="Successful Reponse (201)"
{
    "id": 1,
    "createdAt": "2022-06-05T02:59:46.851Z",
    "updatedAt": "2022-06-05T03:00:51.360Z",
    "site": "danbooru",
    "tags": [
        "mizuhara_chizuru"
    ],
    "tagBlacklist": [
        "comic"
    ],
    "limit": 200,
    "status": "finished",
    "interval": "daily",
    "nextRun": "2022-06-06T03:00:42.543Z"
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.

### GET `/api/subscription/:id`

_Get information about a subscription by id._

Parameters:

* `id`: (required) The numerical ID of the file to update.

```json title="Successful Reponse (200)"
{
    "id": 1,
    "createdAt": "2022-06-05T02:08:40.361Z",
    "updatedAt": "2022-06-05T02:20:06.852Z",
    "site": "danbooru",
    "tags": [
        "mizuhara_chizuru"
    ],
    "tagBlacklist": [
        "comic"
    ],
    "limit": 200,
    "status": "finished",
    "interval": "daily",
    "nextRun": "2022-06-06T02:17:44.655Z",
    "runs": [
        {
            "id": 1,
            "createdAt": "2022-06-05T02:12:04.876Z",
            "updatedAt": "2022-06-05T02:20:06.843Z",
            "site": "danbooru",
            "tags": [
                "mizuhara_chizuru"
            ],
            "status": "finished",
            "pageNumber": 11,
            "downloadedUrlCount": 200,
            "skippedUrlCount": 42,
            "failedUrlCount": 1,
            "finished": true,
            "finishedAt": "2022-06-05T02:20:06.840Z"
        }
    ],
    "_count": {
        "runs": 1
    }
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No run found with matching id.

### GET `/api/subscription/logs/:id`

_Get full logs of a subscription run._

Parameters:

* `id`: (required) The uuid of the run to get the logs of.

```json title="Successful Reponse (200)"
{
    "id": 1,
    "createdAt": "2022-06-05T02:08:40.361Z",
    "updatedAt": "2022-06-05T02:20:06.852Z",
    "site": "danbooru",
    "tags": [
        "mizuhara_chizuru"
    ],
    "tagBlacklist": [
        "comic"
    ],
    "limit": 200,
    "status": "finished",
    "interval": "daily",
    "nextRun": "2022-06-06T02:17:44.655Z",
    "log": [
        {
            "id": "a552ad48-a611-4569-a43a-5bd3d76497ce",
            "subscriptionRunId": 1,
            "url": "https://danbooru.donmai.us/posts/000000",
            "status": "downloaded",
            "createdAt": "2022-06-05T02:12:06.132Z",
            "updatedAt": "2022-06-05T02:12:06.133Z"
        },
        .... etc ....
    ]
}
```

Unsuccessful response codes:

* 400: Missing required fields or invalid field data.
* 404: No run found with matching id.
