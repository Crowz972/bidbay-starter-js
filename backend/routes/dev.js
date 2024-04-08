import express from 'express'
import { regenerateFixtures } from '../orm/fixtures/index.js'

const router = express.Router()

/**
 * Réinitialise la base de données avec les données de test.
 * @name GET/api/dev/reset
 * @function
 * @memberof module:devRouter
 * @param {Response} res - Objet de réponse Express.
 * @returns {string} 200 - OK
 */
router.get('/api/dev/reset', async (req, res) => {
  await regenerateFixtures()
  res.status(200).send('OK')
})

export default router
