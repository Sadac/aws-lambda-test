const { isEmpty } = require('lodash')
const uuid = require('uuid')

const { db } = require('./../../utils/db')
const { parseBody } = require('./../../utils/helpers')
const { HttpStatus, TableNames } = require('./../../constants')
const { ARTISTS, TRACKS_ARTISTS } = TableNames

module.exports.createArtist = async (event) => {
  try {
    const body = parseBody(event.body)
    const { name } = body

    if(isEmpty(name)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Name can not be empty`
        })
      }
    }

    const foundArtist = await db.query(
      `SELECT name FROM "${ARTISTS}" WHERE name = $1`,
      [name]
    )
    if(!isEmpty(foundArtist.rows.shift())){
      return {
        statusCode: HttpStatus.CONFLICT,
        body: JSON.stringify({
          message: `Artist name ${name} already exist.`
        })
      }
    }

    const { rows } = await db.query(
      `INSERT INTO "${ARTISTS}"(name) VALUES($1) RETURNING *`,
      [name]
    )

    return {
      statusCode: HttpStatus.CREATED,
      body: JSON.stringify({
        message: `Artist '${rows[0].name}' created successfully. id: ${rows[0].id}`
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

module.exports.getArtist = async (event) => {
  try {
    const { id } = event.pathParameters

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid artist id`
        })
      }
    }

    const result = await db.query(
      `SELECT * FROM "${ARTISTS}" WHERE id = $1`,
      [id]
    )
    const foundArtist = result.rows.shift()
    if(isEmpty(foundArtist)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `Artist id ${id} not found.`
        })
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify(foundArtist)
    }
  } catch (error) {
    // caputre error in CloudWatch
    console.error(error);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    }
  }
}

module.exports.getArtists = async (event) => {
  try { 
    const result = await db.query(`SELECT * FROM "${ARTISTS}"`)
    
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

module.exports.updateArtist = async (event) => {
  try {
    const body = parseBody(event.body)
    const { name } = body
    const { id } = event.pathParameters

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid artist id`
        })
      }
    }

    if(isEmpty(name)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Name can not be empty`
        })
      }
    }

    const foundArtist = await db.query(
      `SELECT name FROM "${ARTISTS}" WHERE name = $1`,
      [name]
    )
    if(!isEmpty(foundArtist.rows.shift())){
      return {
        statusCode: HttpStatus.CONFLICT,
        body: JSON.stringify({
          message: `Artist name ${name} already exist.`
        })
      }
    }

    const result = await db.query(
      `UPDATE "${ARTISTS}" SET name = $1 WHERE id = $2 RETURNING id`,
      [name, id]
    )
    if(isEmpty(result.rows)){
      return {
        statusCode: HttpStatus.NOT_FOUND,
        body: JSON.stringify({
          message: `There was an error updating artist ${id}`
        })
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Artist ${id} updated`
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

// Row will be hard deleted from database.
// It is better to have a deletedAt column for all rows and update it with
// the date of deletion, but for simplicity I will not take that approach.
module.exports.deleteArtist = async (event) => {
  try {
    const { id } = event.pathParameters

    if(!id || !uuid.validate(id)){
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        body: JSON.stringify({
          message: `Must provide a valid artist id`
        })
      }
    }

    try {
      await db.query('BEGIN')

      await db.query(
        `DELETE FROM "${TRACKS_ARTISTS}" WHERE "artistId" IN($1)`,
        [id]
      )
  
      await db.query(
        `DELETE FROM "${ARTISTS}" WHERE id = $1`,
        [id]
      )

      await db.query('COMMIT')
    } catch (error) {
      await db.query('ROLLBACK')
      console.error('Rolling back transaction when deleting the artist', error)
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: JSON.stringify({
          message: `There was an error deleting the artist`
        })
      }
    }

    return {
      statusCode: HttpStatus.OK,
      body: JSON.stringify({
        message: `Artist ${id} deleted`
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