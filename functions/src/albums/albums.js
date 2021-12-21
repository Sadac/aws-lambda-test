const { isEmpty, merge } = require('lodash')
const uuid = require('uuid')

const { db } = require('./../../utils/db')
const { parseBody } = require('./../../utils/helpers')
const { HttpStatus, TableNames } = require('./../../constants')
const { ALBUMS, ALBUM_TYPE, TRACKS, TRACKS_ARTISTS } = TableNames

module.exports.createAlbum = async (event) => {
  try {
    const body = parseBody(event.body)
    const { title, releaseDate, type } = body

    if(
        isEmpty(title) || 
        isEmpty(releaseDate) || 
        isEmpty(type)
      )
    {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `title, release date and type are required values to create an album`
        })
      }
    }

    // check that album type exist in parametric table
    const foundAlbumType = await db.query(
      `SELECT * FROM "${ALBUM_TYPE}" WHERE type = $1`,
      [type]
    )
    const albumType = foundAlbumType.rows.shift()
    if(isEmpty(albumType)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Album type ${type} does not exist.`
        })
      }
    }

    await db.query(
      `INSERT INTO "${ALBUMS}" (title, "releaseDate", "typeId") 
        VALUES($1, $2, $3) RETURNING id`,
      [title, releaseDate, albumType.id]
    )

    return {
      statusCode: HttpStatus.CREATED,
      body: JSON.stringify({
        message: `Album ${title} created succesfully`
      })
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `There was an error creating the album`
    }
  } 
}

module.exports.getAlbum = async (event) => {
  try {
    const { id } = event.pathParameters

    // Find the album
    const albumResult = await db.query(
      `SELECT 
        al.id, al.title, al."releaseDate",
        at.type
      FROM "Albums" al
      INNER JOIN "AlbumType" at 
      ON (at.id = al."typeId" AND al.id = $1)`, 
      [id]
    )
    if(isEmpty(albumResult.rows)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Album ${id} not found.`
        })
      }
    }
    let album = albumResult.rows[0]

    // Find the tracks of the album
    const tracksResult = await db.query(`SELECT * FROM "${TRACKS}" WHERE "albumId" = $1`, [id])
    album = {
      ...album,
      tracks: tracksResult.rows.map(t => ({
        id: t.id,
        title: t.title,
        duration: t.duration,
        discNumber: t.discNumber,
        trackNumber: t.trackNumber
      })),
      artists: []
    }

    if(!isEmpty(tracksResult.rows)){
      // Find the artists of the album
      const artistsResult = await db.query(`
      SELECT * FROM "Artists" WHERE id IN(
        SELECT "artistId" FROM "TracksArtists"
        WHERE "trackId" = ANY ($1::UUID[]) 
        GROUP BY "artistId"
      )`, [tracksResult.rows.map(t => t.id)])
      album ={
        ...album,
        artists: artistsResult.rows
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify(album)
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
  
}

module.exports.getAlbums = async (event) => {
  try { 
    const result = await db.query(`SELECT * FROM "${ALBUMS}"`)
    
    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify(result.rows)
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
}

module.exports.updateAlbum = async (event) => {

  return {
    statusCode: HttpStatus.OK,
    body: JSON.stringify({
      message: `get albums not implemented`
    })
  }
}

// update basic album fiedls: title, releaseDate, type
// to update album tracks and albums artists there are such methods to do it
module.exports.updateAlbum = async (event) => {
  try {
    const { id } = event.pathParameters
    console.log(event.body)
    const body = parseBody(event.body)

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid track id`
        })
      }
    }

    if(body.typeId){
      // check that album type exist in parametric table
      const foundAlbumType = await db.query(
        `SELECT * FROM "${ALBUM_TYPE}" WHERE id = $1`,
        [body.typeId]
      )
      const albumType = foundAlbumType.rows.shift()
      if(isEmpty(albumType)){
        return {
          statusCode: HttpStatus.NOT_FOUND,
          body: JSON.stringify({
            message: `Album type ${id} does not exist.`
          })
        }
      }
    }

    const albumQuery = await db.query(
      `SELECT * FROM "${ALBUMS}" WHERE id = $1`,
      [id]
    )
    const foundAlbum = albumQuery.rows.shift()
    if(isEmpty(foundAlbum)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Album ${id} not found.`
        })
      }
    }

    const { title,  releaseDate, typeId } = merge(foundAlbum, body)

    await db.query(`
      UPDATE "${ALBUMS}" SET title=$1, "releaseDate"=$2, "typeId"=$3
      WHERE id = $4`, 
      [title, releaseDate, typeId, id]
    )

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Album ${id} updated`
      })
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
}

module.exports.deleteAlbum = async (event) => {
  try {
    const { id } = event.pathParameters

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid album id`
        })
      }
    }

    try {
      await db.query('BEGIN')

      await db.query(`
        DELETE FROM "${TRACKS_ARTISTS}" 
        WHERE "trackId" IN (SELECT id FROM "${TRACKS}" WHERE "albumId" = $1)`,
        [id]
      )
  
      await db.query(
        `DELETE FROM "${TRACKS}" WHERE "albumId" = $1`,
        [id]
      )

      await db.query(
        `DELETE FROM "${ALBUMS}" WHERE id = $1`,
        [id]
      )

      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Rolling back transaction when deleting the album', error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: `There was an error deleting the album`
        })
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Album ${id} deleted`
      })
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
}