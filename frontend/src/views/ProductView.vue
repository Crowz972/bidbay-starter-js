<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../store/auth";

const { isAuthenticated, isAdmin, userData, token } = useAuthStore();

const route = useRoute();
const router = useRouter();
const product = ref();

const loading = ref(false);
const error = ref(false);
const productId = ref(route.params.productId);

/**
 * @param {number|string|Date|VarDate} date
 */
function formatDate(date:Date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("fr-FR", options);
}

async function getProduct() {
  loading.value = true;
  error.value = false;
  try {
    const response = await fetch('http://localhost:3000/api/products/' + productId.value);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    product.value = data;
  } catch (e) {
    console.error('Error fetching products:', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const getDate = (date:Date) => {
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      const dateObj = new Date(date);
      const day = dateObj.getUTCDate();
      const month = months[dateObj.getUTCMonth()];
      const year = dateObj.getUTCFullYear();
      return `${day} ${month} ${year}`;
}

getProduct();

var now = new Date();
</script>

<template>
  <div class="row">
    <div class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div class="alert alert-danger mt-4" v-if="error" role="alert" data-test-error>
      Une erreur est survenue lors du chargement des produits.
    </div>

    <div class="row" data-test-product>
      <!-- Colonne de gauche : image et compte à rebours -->

      <div class="col-lg-4">
          <img
            v-if="product"
            :src="product['pictureUrl']"
            :alt="product['name']"
            class="img-fluid rounded mb-3"
            data-test-product-picture
          />
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">Compte à rebours</h5>
          </div>
          <div class="card-body">
            <h6 class="card-subtitle mb-2 text-muted" data-test-countdown>
              <template v-if="product">
                Temps restant : {{ new Date(new Date(product['endDate']).getTime() - now.getTime()) }}
              </template>
            </h6>
          </div>
        </div>
      </div>

      <!-- Colonne de droite : informations du produit et formulaire d'enchère -->
      <div class="col-lg-8">
        <div class="row">
          <div class="col-lg-6">
            <h1 class="mb-3" data-test-product-name>
              <template v-if="product">
                {{ product['name'] }}
            </template>
            </h1>
          </div>
          <div class="col-lg-6 text-end">
            <RouterLink
                v-if="product"
                :to="{ name: 'ProductEdition', params: { productId: product['id'] } }"
                class="btn btn-primary"
                data-test-edit-product
              >
                Editer
              </RouterLink>
              &nbsp;
            <button class="btn btn-danger" data-test-delete-product>
              Supprimer
            </button>
          </div>
        </div>

        <h2 class="mb-3">Description</h2>
        <p data-test-product-description>
          <template v-if="product">
          {{ product['description'] }}
        </template>
        </p>

        <h2 class="mb-3">Informations sur l'enchère</h2>
        <ul v-if="product">
          <li data-test-product-price>Prix de départ : {{ product['originalPrice'] }} €</li>
          <li data-test-product-end-date>{{ getDate(product['endDate']) }}</li>
          <li v-if="product['seller']">
            Vendeur :
            <router-link :to="{ name: 'User', params: { userId: product['sellerId'] } }" data-test-product-seller>
              {{ product['seller']['username'] }}
            </router-link>
          </li>
        </ul>

        <h2 class="mb-3">Offres sur le produit</h2>
        <table class="table table-striped" data-test-bids>
          <thead>
            <tr>
              <th scope="col">Enchérisseur</th>
              <th scope="col">Offre</th>
              <th scope="col">Date</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody v-if="product && product['bids']">
            <tr v-for="bid in product['bids']" :key="bid" data-test-bid>
              <td v-if="bid['bidder']">
                <router-link
                  :to="{ name: 'User', params: { userId: bid['bidder']['id'] } }"
                  data-test-bid-bidder
                >
                  {{ bid['bidder']['username'] }}
                </router-link>
              </td>
              <td data-test-bid-price> {{bid['price']}} €</td>
              <td data-test-bid-date>{{bid['date']}}</td>
              <td>
                <button class="btn btn-danger btn-sm" data-test-delete-bid>
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p data-test-no-bids>Aucune offre pour le moment</p>

        <form data-test-bid-form>
          <div class="form-group">
            <label for="bidAmount">Votre offre :</label>
            <input
              type="number"
              class="form-control"
              id="bidAmount"
              data-test-bid-form-price
            />
            <small class="form-text text-muted">
              Le montant doit être supérieur à 10 €.
            </small>
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            disabled
            data-test-submit-bid
          >
            Enchérir
          </button>
        </form>
      </div>
    </div>
  </div>
</template>