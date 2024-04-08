<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../store/auth";

const { isAuthenticated, isAdmin, userData, token } = useAuthStore();

const route = useRoute();
const router = useRouter();

const errorText = ref("")
const loading = ref(true)
const offerPrice = ref(10)

const connectedUserId = isAuthenticated.value ? userData.value.id : ''

const productId = ref(route.params.productId);
const product = ref({})
const countdownDiff = ref(0)

const bidLowerPrice = computed(() => {
  const bids = product.value?.bids ?? []

  bids.sort((b1, b2) => b2.price - b1.price)

  return bids?.[0]?.price ?? product.value?.originalPrice ?? 10
})

// Met à jour la valeur de countdownDiff toutes les secondes
setInterval(() => {
  if (countdownDiff.value > 0) countdownDiff.value--
}, 1e3)

// Formate la date dans le format "jour mois année"
function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" }

  return new Date(date).toLocaleDateString("fr-FR", options)
}

// Calcule le texte pour le compte à rebours (jours, heures, minutes, secondes)
function countdownText(currentText, word, count, first, last = false) {
  if (count == 0) {
    if (last) {
      if (currentText.startsWith(' et ')) {
        currentText = currentText.slice(4)
      } else if (currentText.startsWith(', ')) {
        currentText = currentText.slice(2)
      }
    }

    return {
      text: currentText,
      first: first
    }
  }

  currentText = `${!last ? first ? ' et ' : ', ' : ''}${count} ${word}${currentText}`

  return {
    text: currentText,
    first: false
  }
}

// Calcule le compte à rebours en fonction de l'unité de temps (jours, heures, minutes, secondes)
function countdownCalcul(config, divCount, modCount, word, last = false) {
  config.count = Math.floor((config.count - config.diff) / divCount)

  config.diff = last ? config.count : config.count % modCount

  config = {
    count: config.count,
    diff: config.diff,
    ...countdownText(config.text, word, config.diff, config.first, last)
  }

  return config
}

// Calcule le compte à rebours total à afficher
const countdown = computed(() => {
  let config = {
    text: ' restants',
    first: true,
    count: countdownDiff.value,
    count2: countdownDiff.value,
    diff: 0
  }

  config = countdownCalcul(config, 1, 60, 'secondes', false)
  config = countdownCalcul(config, 60, 60, 'minutes', false)
  config = countdownCalcul(config, 60, 24, 'heures', false)
  config = countdownCalcul(config, 24, 30, 'jours', false)
  config = countdownCalcul(config, 30, 12, 'mois', false)
  config = countdownCalcul(config, 12, 1, 'années', true)

  return config.text
})

// Récupère le produit correspondant à l'ID actuel
async function getProduct() {
  const query = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
    'method': 'GET',
    'headers': {
      'Content-Type': 'application/json',
    }
  })

  const res = await query.json()

  if (query.ok) {
    product.value = res

    offerPrice.value = product.value.originalPrice
    countdownDiff.value = Math.floor(Math.abs(Date.now() - new Date(product.value.endDate)) / 1000)
  } else {
    errorText.value = `${res?.error}: ${res?.details}` ?? 'Une erreur est survenue'
  }

  loading.value = false
}

// Supprime le produit correspondant à l'ID actuel
async function deleteProduct() {
  if (loading.value) return

  loading.value = true

  const query = await fetch(`http://localhost:3000/api/products/${productId.value}`, {
    'method': 'DELETE',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`
    }
  })

  if (query.ok) {
    router.push({ name: "Home" })
  } else {
    const res = await query.json()

    errorText.value = `${res?.error}: ${res?.details}` ?? 'Une erreur est survenue'
  }

  loading.value = false
}

async function sendOffer() {
  if (loading.value) return

  loading.value = true

  const query = await fetch(`http://localhost:3000/api/products/${productId.value}/bids`, {
    'method': 'POST',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`
    },
    'body': JSON.stringify({'price': offerPrice.value})
  })

  const res = await query.json()

  if (query.ok) {
    getProduct()
  } else {
    errorText.value = `${res?.error}: ${res?.details}` ?? 'Une erreur est survenue'
  }

  loading.value = false
} 

async function deleteBid(bidId) {
  if (loading.value) return

  loading.value = true

  const query = await fetch(`http://localhost:3000/api/bids/${bidId}`, {
    'method': 'DELETE',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.value}`
    }
  })

  if (query.ok) {
    getProduct()
  } else {
    const res = await query.json()

    errorText.value = `${res?.error}: ${res?.details}` ?? 'Une erreur est survenue'
  }

  loading.value = false
}
</script>

<template>
  <div class="row">
    <div v-if="loading" class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div v-if="errorText !== ''" class="alert alert-danger mt-4" role="alert" data-test-error>
      {{ errorText }}
    </div>

    <div v-if="!loading && errorText == ''" class="row" data-test-product>
      <!-- Colonne de gauche : image et compte à rebours -->
      <div class="col-lg-4">
        <img :src="product.pictureUrl" alt="" class="img-fluid rounded mb-3" data-test-product-picture />
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">Compte à rebours</h5>
          </div>
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted" data-test-countdown>
              Temps restant : {{ countdown }}
            </h6>
          </div>
        </div>
      </div>

      <!-- Colonne de droite : informations du produit et formulaire d'enchère -->
      <div class="col-lg-8">
        <div class="row">
          <div class="col-lg-6">
            <h1 class="mb-3" data-test-product-name>
              {{ product.name }}
            </h1>
          </div>
          <div v-if="product.sellerId === connectedUserId || isAdmin" class="col-lg-6 text-end">
            <RouterLink :to="{ name: 'ProductEdition', params: { productId: product.id } }" class="btn btn-primary"
              data-test-edit-product>
              Editer
            </RouterLink>
            &nbsp;
            <button @click="deleteProduct" class="btn btn-danger" data-test-delete-product>
              Supprimer
            </button>
          </div>
        </div>

        <h2 class="mb-3">Description</h2>
        <p data-test-product-description>
          {{ product.description }}
        </p>

        <h2 class="mb-3">Informations sur l'enchère</h2>
        <ul>
          <li data-test-product-price>Prix de départ : {{ product.originalPrice }} €</li>
          <li data-test-product-end-date>Date de fin : {{ formatDate(product.endDate) }}</li>
          <li>
            Vendeur :
            <router-link :to="{ name: 'User', params: { userId: product.seller.id } }" data-test-product-seller>
              {{ product.seller.username }}
            </router-link>
          </li>
        </ul>

        <h2 class="mb-3">Offres sur le produit</h2>
        <table v-if="product.bids.length > 0" class="table table-striped" data-test-bids>
          <thead>
            <tr>
              <th scope="col">Enchérisseur</th>
              <th scope="col">Offre</th>
              <th scope="col">Date</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bid in product.bids" :key="bid.id" data-test-bid>
              <td>
                <router-link :to="{ name: 'User', params: { userId: bid.bidder.id } }" data-test-bid-bidder>
                  {{ bid.bidder.username }}
                </router-link>
              </td>
              <td data-test-bid-price>{{ bid.price }} €</td>
              <td data-test-bid-date>{{ formatDate(bid.date) }}</td>
              <td>
                <button @click="deleteBid(bid.id)" v-if="bid.bidder.id === connectedUserId || isAdmin" class="btn btn-danger btn-sm"
                  data-test-delete-bid>
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <p v-if="product.bids.length == 0" data-test-no-bids>Aucune offre pour le moment</p>

        <form data-test-bid-form @submit.prevent="sendOffer">
          <div class="form-group">
            <label for="bidAmount">Votre offre :</label>
            <input v-model="offerPrice" type="number" min="10" class="form-control" id="bidAmount"
              data-test-bid-form-price />
            <small class="form-text text-muted">
              Le montant doit être supérieur à {{ bidLowerPrice }} €.
            </small>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="offerPrice <= bidLowerPrice" data-test-submit-bid>
            Enchérir
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
