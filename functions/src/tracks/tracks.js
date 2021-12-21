const { isEmpty, difference } = require('lodash')
const uuid = require('uuid')

const { db } = require('./../../utils/db')
const { parseBody } = require('./../../utils/helpers')
const { HttpStatus, TableNames } = require('./../../constants')
const { ARTISTS, TRACKS, TRACKS_ARTISTS } = TableNames

module.exports.createTrack = async (event) => {
  try {
    const body = parseBody(event.body)
    const { 
      title, 
      albumId, 
      artists, 
      duration, 
      discNumber, 
      trackNumber } = body
    
    // TODO: validate array of artists ids
    if(
        isEmpty(title) || 
        (isEmpty(albumId) || !uuid.validate(albumId)) ||
        isEmpty(artists) ||
        !duration ||
        !discNumber ||
        !trackNumber
      )
    {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `title, albumId, artists, duration, discNumber, trackNumber are required fields.`
        })
      }
    }

    // check if all the artists exists
    const artistsResult = await db.query(
      `SELECT id FROM "${ARTISTS}" WHERE id = ANY($1)`,
      [artists]
    )
    const foundArtistsIds = artistsResult.rows.map(artist => artist.id)
    const notFoundArtistsIds = difference(artists, foundArtistsIds)
    if(!isEmpty(notFoundArtistsIds)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Artists with ids ${notFoundArtistsIds} not found.`
        })
      }
    }

    // find track for album.
    // name, disc and track number can't be repeated
    const foundTrackAlbum = await db.query(
      `SELECT * FROM "${TRACKS}" 
        WHERE title = $1 
        AND "albumId" = $2
        AND "discNumber" = $3
        AND "trackNumber" = $4`,
      [title, albumId, discNumber, trackNumber]
    )
    if(!isEmpty(foundTrackAlbum.rows.shift())){
      return {
        statusCode: HttpStatus.CONFLICT,
        body: JSON.stringify({
          message: `Track ${title} already exist on album ${albumId}.`
        })
      }
    }

    // TODO:
    // VALIDATE trackNumber cant be repeated for a track
    // with the same albumId and discNumber
    
    try {
      await db.query('BEGIN')

      // create the track and associate to an album
      const track = await db.query(
        `INSERT INTO "${TRACKS}"
        (title, "albumId", duration, "discNumber", "trackNumber") 
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [title, albumId, duration, discNumber, trackNumber]
      )

      // create the TracksArtists relation
      const createTrackArtistsPromise = artists.map((artistId) => {
        return new Promise(
          resolve => resolve(
            db.query(
              `INSERT INTO "${TRACKS_ARTISTS}" ("artistId", "trackId") VALUES ($1, $2)`,
              [artistId, track.rows[0].id]
            )
          )
        )
      })
      Promise.all(createTrackArtistsPromise)

      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Rolling back transaction when creating the track', error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: `There was an error creating the track`
        })
      }
    }

    return {
      statusCode: HttpStatus.CREATED,
      body: JSON.stringify({
        message: `Track ${title} created succesfully`
      })
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `There was an error creating the track`
    }
  } 
}

module.exports.getTrack = async (event) => {
  try {
    const { id } = event.pathParameters
    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid track id`
        })
      }
    }

    // Find the album
    const trackResult = await db.query(`
      SELECT 
        t.id, t.title, t."albumId", t.duration, t."discNumber", t."trackNumber",
        ta."artistId",
        a.name
      FROM "Tracks" t
      INNER JOIN "${TRACKS_ARTISTS}" ta ON (ta."trackId" = t.id AND t.id = $1)
      INNER JOIN "${ARTISTS}" a ON (a.id = ta."artistId")`, 
      [id]
    )
    const trackData = trackResult.rows[0]
    if(isEmpty(trackData)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Track ${id} not found.`
        })
      }
    }
    
    const track = {
      id: trackData.id,
      title: trackData.title,
      albumId: trackData.albumId,
      duration: trackData.duration,
      discNumber: trackData.discNumber,
      trackNumber: trackData.trackNumber,
      artists: trackResult.rows.map(t => ({id: t.artistId, name: t.name}))
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify(track)
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
  
}

module.exports.getTracks = async (event) => {
  try { 
    const result = await db.query(`SELECT * FROM "${TRACKS}"`)
    
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

// update basic track fields of the table,
// for this example I will avoid update
// artists and albumId. Nevertheless for such change
// a track delete and then a track creation could be used instead
module.exports.updateTrack = async (event) => {
  try {
    const { id } = event.pathParameters
    const body = parseBody(event.body)
    const { 
      title,  
      duration, 
      discNumber, 
      trackNumber } = body

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid track id`
        })
      }
    }
    
    if(
        isEmpty(title) || 
        !duration ||
        !discNumber ||
        !trackNumber
      )
    {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `title, duration, discNumber, trackNumber are required fields.`
        })
      }
    }

    const foundTrack = await db.query(
      `SELECT * FROM "${TRACKS}" WHERE id = $1`,
      [id]
    )
    if(isEmpty(foundTrack.rows.shift())){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Track ${id} not found.`
        })
      }
    }

    const result = await db.query(`
      UPDATE "${TRACKS}" 
      SET title=$1, duration=$2, "discNumber"=$3, "trackNumber"=$4
      WHERE id = $5 RETURNING id`,
      [title, duration, discNumber, trackNumber, id]
    )
    if(isEmpty(result.rows)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `There was an error updating track ${id}`
        })
      }
    }

    // TODO: delete artist from a track, hence delete it from the album

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Track ${id} updated`
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

module.exports.deleteTrack = async (event) => {
  try {
    const { id } = event.pathParameters

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid track id`
        })
      }
    }

    const foundTrack = await db.query(
      `SELECT * FROM "${TRACKS}" WHERE id = $1`,
      [id]
    )
    const track = foundTrack.rows.shift()
    if(isEmpty(track)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Track ${id} does not exist.`
        })
      }
    }

    try {
      await db.query('BEGIN')

      await db.query(`
        DELETE FROM "${TRACKS_ARTISTS}" 
        WHERE "trackId" IN ($1)`,
        [id]
      )
  
      await db.query(
        `DELETE FROM "${TRACKS}" WHERE id = $1`,
        [id]
      )

      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Rolling back transaction when deleting the track', error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: `There was an error deleting the track`
        })
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Track ${id} deleted`
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