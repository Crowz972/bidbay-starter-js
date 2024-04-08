<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router"; // Importation des fonctions de routage de Vue Router

import { useAuthStore } from "../store/auth"; // Importation du store d'authentification

const { isAuthenticated, userData } = useAuthStore(); // Récupération des informations d'authentification à partir du store

const router = useRouter(); // Initialisation du router
const route = useRoute(); // Initialisation de la route courante

const errorText = ref(""); // Initialisation d'une référence pour stocker le message d'erreur
const loading = ref(true); // Initialisation d'une référence pour stocker l'état de chargement

const userId = ref(route.params.userId); // Récupération de l'ID de l'utilisateur à partir de la route
const user = ref({}); // Initialisation d'une référence pour stocker les informations de l'utilisateur

// Si l'ID de l'utilisateur est "me", cela signifie qu'il s'agit de l'utilisateur connecté
if (userId.value === "me") {
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!isAuthenticated.value) {
    router.push({ name: "Login" });
  }

  // Utiliser l'ID de l'utilisateur connecté
  userId.value = userData.value.id;
}

// Fonction pour formater la date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

// Fonction pour obtenir le prix d'enchère le plus élevé
const bidUpperPrice = (product) => {
  const bids = product.bids

  bids.sort((b1, b2) => b2.price - b1.price)

  return bids?.[0]?.price ?? product.originalPrice
}

// Fonction pour déterminer si une enchère est gagnante
const winBidStatus = (bid) => {
  const productBids = bid.product.bids

  productBids.sort((b1, b2) => b2.price - b1.price)

  console.log('---')
  console.log(productBids?.[0]?.id, productBids?.[0]?.price)
  console.log(bid.id, bid.price)

  if (productBids?.[0] && productBids?.[0].id === bid.id) return true

  return false
}

// Fonction pour filtrer les enchères par date
const filterBidsByDate = (bids) => {
  return bids.sort((b1, b2) => new Date(b2.date) - new Date(b1.date))
}

// Fonction pour récupérer les informations de l'utilisateur
async function getUser() {
  const query = await fetch(`http://localhost:3000/api/users/${userId.value}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const res = await query.json();

  if (query.ok) {
    user.value = res; // Stocker les informations de l'utilisateur dans la référence "user"
  } else {
    errorText.value =
      `${res?.error}: ${res?.details}` ?? "Une erreur est survenue"; // Stocker le message d'erreur dans la référence "errorText"
  }

  loading.value = false; // Mettre l'état de chargement à "false"
}

getUser();
</script>

<template>
  <div>
    <h1 v-if="!loading && !errorText" class="text-center" data-test-username>
      Utilisateur {{ user.username }}
      <span
        v-if="user.admin"
        class="badge rounded-pill bg-primary"
        data-test-admin
        >Admin</span
      >
    </h1>
    <div v-if="loading" class="text-center" data-test-loading>
      <span class="spinner-border"></span>
      <span>Chargement en cours...</span>
    </div>
    <div v-if="errorText" class="alert alert-danger mt-3" data-test-error>
      {{ errorText }}
    </div>
    <div v-if="!loading && !errorText" data-test-view>
      <div class="row">
        <div class="col-lg-6">
          <h2>Produits</h2>
          <div class="row">
            <div
              class="col-md-6 mb-6 py-2"
              v-for="product of user.products"
              data-test-product
            >
              <div class="card">
                <RouterLink
                  :to="{ name: 'Product', params: { productId: product.id } }"
                >
                  <img
                    :src="product.pictureUrl"
                    class="card-img-top"
                    data-test-product-picture
                  />
                </RouterLink>
                <div class="card-body">
                  <h5 class="card-title">
                    <RouterLink
                      :to="{
                        name: 'Product',
                        params: { productId: product.id },
                      }"
                      data-test-product-name
                    >
                      {{ product.name }}
                    </RouterLink>
                  </h5>
                  <p class="card-text" data-test-product-description>
                    {{ product.description }}
                  </p>
                  <p class="card-text" data-test-product-price>
                    Prix actuel : {{ bidUpperPrice(product) }} €
                  </p>
                  <p class="card-text">
                    Nombre d'offres : {{ product.bids.length }} €
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <h2>Offres</h2>
          <table class="table table-striped">
            <thead>
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Offre</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bid of filterBidsByDate(user.bids)" data-test-bid>
                <td>
                  <RouterLink
                    :to="{
                      name: 'Product',
                      params: { productId: bid.product.id },
                    }"
                    data-test-bid-product
                  >
                    {{ bid.product.name }}
                  </RouterLink>
                </td>
                <td data-test-bid-price>{{ bid.price }} €</td>
                <td data-test-bid-date>{{ formatDate(bid.date) }}</td>
                <td data-test-bid-date>{{ winBidStatus(bid) ? 'Gagnante' : 'Perdante' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
