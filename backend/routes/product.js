import express from 'express'
import { Product, Bid, User } from '../orm/index.js'
import authMiddleware from '../middlewares/auth.js'
import { getDetails } from '../validators/index.js'

const router = express.Router()

// Récupérer tous les produits avec leurs vendeurs et enchères associées
router.get('/api/products', async (req, res, next) => {
  const products = await Product.findAll({
    attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate'],
    include: [{
      model: User,
      as: 'seller',
      attributes: ['id', 'username']
    },
    {
      model: Bid,
      as: 'bids',
      attributes: ['id', 'price', 'date']
    }]
  })

  res.json(products)
})

// Récupérer un produit spécifique avec son vendeur et ses enchères associées
router.get('/api/products/:productId', async (req, res) => {
  const product = await Product.findByPk(req.params.productId, {
    attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate', 'sellerId'],
    include: [{
      model: User,
      as: 'seller',
      attributes: ['id', 'username']
    },
    {
      model: Bid,
      as: 'bids',
      attributes: ['id', 'price', 'date'],
      include: [
        {
          model: User,
          as: 'bidder',
          attributes: ['id', 'username']
        }
      ]
    }]
  })

  if (!product) return res.status(404).json({ erreur: 'Produit non trouvé' })

  res.json(product)
})

router.post('/api/products', authMiddleware, async (req, res) => {
  const { name, description, category, originalPrice, pictureUrl, endDate } = req.body

  try {
    const savedProduct = await Product.create({
      name,
      description,
      category,
      originalPrice,
      pictureUrl,
      endDate,
      sellerId: req.user.id
    })

    const returnedSavedProduct = await Product.findByPk(savedProduct.id, {
      attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate', 'sellerId']
    })

    return res.status(201).json(returnedSavedProduct)
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or missing fields', details: getDetails(e) })
  }
})

// Mettre à jour un produit existant
router.put('/api/products/:productId', authMiddleware, async (req, res) => {
  const product = await Product.findByPk(req.params.productId, {
    attributes: ['id', 'name', 'description', 'category', 'originalPrice', 'pictureUrl', 'endDate', 'sellerId']
  })

  if (!product) return res.status(404).json({ erreur: 'Produit non trouvé' })

  if (product.sellerId !== req.user.id && !req.user.admin) return res.status(403).json({ erreur: 'Utilisateur non autorisé' })

  try {
    await product.update(req.body)

    res.status(200).json(product)
  } catch (e) {
    res.status(400).json({ erreur: 'Champs invalides ou manquants', details: getDetails(e) })
  }
})

// Supprime un produit existant
router.delete('/api/products/:productId', authMiddleware, async (req, res) => {
  const product = await Product.findByPk(req.params.productId, {
    attributes: ['id', 'sellerId']
  })

  if (!product) return res.status(404).json({ error: 'Product not found' })

  if (product.sellerId !== req.user.id && !req.user.admin) return res.status(403).json({ error: 'User not granted' })

  await Product.destroy({ where: { id: req.params.productId } })

  res.status(204).json({})
})

export default router
