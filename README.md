# API usage
Having an UI interface, you will be able to create artists, tracks and gather all the data to create an album, but using the API you will need to use different endpoints to fill up all the data.

1. Create the artists
```json
{
	"name": "Tommy Portimo"
}
```
2. Create the album with the basic data
```json
{
	"title": "Unia",
	"releaseDate": "2022-01-10T21:37:03.149Z",
	"type": "single"
}
```
3. Create the tracks
 ```json
{
	"title": "Unia",
	"albumId": "uuid.v4",
	"duration": 360,
    "discNumber": 1,
    "trackNumber": 4,
    "artists": ["uuid.v4", "uuid.v4"]
}
```

# Restore/backup DATABASE
```sh
# backup
pg_dump -U myuser -W -h host dbname > file.sql

#restore
psql -U myuser -W -h host dbname < backup_pg_dump.sql 
```
