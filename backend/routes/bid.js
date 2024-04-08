import authMiddleware from '../middlewares/auth.js'
import { Bid, Product } from '../orm/index.js'
import express from 'express'
import { getDetails } from '../validators/index.js'

const router = express.Router()

// Supprime une enchère spécifique en fonction de son ID
router.delete('/api/bids/:bidId', authMiddleware, async (req, res) => {
  const bid = await Bid.findByPk(req.params.bidId, {
    attributes: ['id', 'bidderId']
  })

  // Si l'enchère n'existe pas, retourne une erreur 404
  if (!bid) return res.status(404).json({ error: 'Enchère non trouvée' })

  // Si l'utilisateur n'est pas l'enchérisseur et n'est pas administrateur, retourne une erreur 403
  if (bid.bidderId !== req.user.id && !req.user.admin) return res.status(403).json({ error: 'Utilisateur non autorisé' })

  // Supprime l'enchère
  await Bid.destroy({ where: { id: req.params.bidId } })

  res.status(204).json({})
})

router.post('/api/products/:productId/bids', authMiddleware, async (req, res) => {
  const { price } = req.body

  // Vérifie si le prix est présent dans le corps de la requête
  if (!price) {
    return res.status(400).json({ error: 'Invalid or missing fields', details: ['Price is required'] })
  }

  // Trouve le produit correspondant à l'ID spécifié
  const product = await Product.findByPk(req.params.productId)

  // Si le produit n'existe pas, retourne une erreur 404
  if (!product) return res.status(404).json({ error: 'Product not found' })

  try {
    // Obtient la date actuelle
    const date = new Date()

    // Crée une nouvelle enchère avec les détails fournis
    const savedBid = await Bid.create({
      price,
      date, // Utilise la date actuelle
      productId: req.params.productId,
      bidderId: req.user.id
    }, {
      returning: ['id']
    })

    // Récupère l'enchère créée avec les détails importants
    const returnedSavedBid = await Bid.findByPk(savedBid.id, {
      attributes: ['id', 'productId', 'price', 'date', 'bidderId']
    })

    // Retourne la nouvelle enchère créée
    res.status(201).json(returnedSavedBid)
  } catch (e) {
    // Si des champs sont manquants ou invalides, retourne une erreur 400 avec les détails de l'erreur
    res.status(400).json({ error: 'Invalid or missing fields', details: getDetails(e) })
  }
})

export default router
