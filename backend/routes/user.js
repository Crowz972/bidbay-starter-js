import express from 'express'
import { User, Product, Bid } from '../orm/index.js'

const router = express.Router()

// Récupérer les informations d'un utilisateur en particulier
router.get('/api/users/:userId', async (req, res) => {
  // Chercher l'utilisateur avec l'id fourni et inclure ses produits et ses enchères
  const user = await User.findByPk(req.params.userId, {
    attributes: ['id', 'username', 'admin'],
    include: [{
      model: Product,
      as: 'products',
      attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate'],
      include: [{
        model: Bid,
        as: 'bids',
        attributes: ['id', 'price', 'date']
      }]
    },
    {
      model: Bid,
      as: 'bids',
      attributes: ['id', 'price', 'date'],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate'],
        include: [{
          model: Bid,
          as: 'bids',
          attributes: ['id', 'price', 'date']
        }]
      }]
    }]
  })

  if (!user) return res.status(404).json({ erreur: 'Utilisateur non trouvé' })

  res.json(user)
})

export default router
