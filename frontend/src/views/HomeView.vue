Bien sûr, voici le code avec des commentaires en français et des messages d'erreur en français:

<script setup>
import { ref, computed } from "vue";

// Initialisation des variables réactives
const errorText = ref("");
const loading = ref(true);

// Filtrage et tri des produits
const typeToSort = ref(1); // type de tri : 1 (nom) ou 2 (enchère)
const nameToFilter = ref(""); // nom du produit recherché
const productsList = ref([]); // liste des produits récupérés depuis l'API

// Fonction pour formater la date
function formatDate(date) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(date).toLocaleDateString("fr-FR", options);
}

// Fonction pour récupérer la meilleure enchère ou le prix original du produit
const bidUpperPrice = (product) => {
  const bids = product.bids;

  bids.sort((b1, b2) => b2.price - b1.price);

  return bids?.[0]?.price ?? product.originalPrice;
};

// Fonction pour récupérer la liste des produits depuis l'API
async function getProducts() {
  const query = await fetch("http://localhost:3000/api/products", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const res = await query.json();

  // Si la requête a réussi, on met à jour la liste des produits
  if (query.ok) {
    productsList.value = res;
  } else { // Sinon, on affiche un message d'erreur
    errorText.value =
      `${res?.error}: ${res?.details}` ?? "Une erreur est survenue";
  }

  loading.value = false; // On indique que le chargement est terminé
}

// Fonction pour changer le type de tri
function setSortValue(valeur) {
  typeToSort.value = valeur;
}

getProducts(); // On appelle la fonction pour récupérer la liste des produits

// On crée une variable calculée pour filtrer et trier les produits en fonction des critères choisis
const filteredProducts = computed(() => {
  let filteredProducts = productsList.value;

  // On filtre les produits en fonction du nom recherché
  if (nameToFilter.value.length > 0) {
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(nameToFilter.value.toLowerCase())
    );
  }

  // On trie les produits en fonction du type de tri choisi
  if (typeToSort.value == null) { // Si aucun type de tri n'a été choisi, on renvoie la liste filtrée telle quelle
    return filteredProducts;
  }

  if (typeToSort.value == 1) { // Si le tri par nom a été choisi, on trie les produits par ordre alphabétique
    filteredProducts.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
  } else if (typeToSort.value == 2) {
    // Si le tri par enchère a été choisi, on trie les produits par ordre de prix de la meilleure enchère
    filteredProducts.sort(function (a, b) {
      if (a.bids.length > 0 && b.bids.length > 0)
        return (
          a.bids[a.bids.length - 1].price - b.bids[b.bids.length - 1].price
        );
      if (a.bids.length > 0 && b.bids.length == 0)
        return a.bids[a.bids.length - 1].price - b.originalPrice;
      if (a.bids.length == 0 && b.bids.length > 0)
        return a.originalPrice - b.bids[b.bids.length - 1].price;
      if (a.bids.length == 0 && b.bids.length == 0)
        return a.originalPrice - b.originalPrice;
    });
  }

  return filteredProducts;
});
</script>

<template>
  <div>
    <h1 class="text-center mb-4">Liste des produits</h1>

    <div class="row mb-3">
      <div class="col-md-6">
        <form>
          <div class="input-group">
            <span class="input-group-text">Filtrage</span>
            <input
              v-model="nameToFilter"
              type="text"
              class="form-control"
              placeholder="Filtrer par nom"
              data-test-filter
            />
          </div>
        </form>
      </div>
      <div class="col-md-6 text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            data-test-sorter
          >
            Trier par {{ typeToSort == 1 ? "nom" : "prix" }}
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <a class="dropdown-item" href="#" v-on:click="setSortValue(1)">
                Nom
              </a>
            </li>
            <li>
              <a
                class="dropdown-item"
                href="#"
                v-on:click="setSortValue(2)"
                data-test-sorter-price
              >
                Prix
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center mt-4" data-test-loading>
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
    </div>

    <div
      v-if="errorText"
      class="alert alert-danger mt-4"
      role="alert"
      data-test-error
    >
      {{ errorText }}
    </div>
    <div v-if="!loading && !errorText" class="row">
      <div
        class="col-md-4 mb-4"
        v-for="product of filteredProducts"
        data-test-product
      >
        <div class="card">
          <RouterLink
            :to="{ name: 'Product', params: { productId: product.id } }"
          >
            <img
              :src="product.pictureUrl"
              data-test-product-picture
              class="card-img-top"
            />
          </RouterLink>
          <div class="card-body">
            <h5 class="card-title">
              <RouterLink
                data-test-product-name
                :to="{ name: 'Product', params: { productId: product.id } }"
              >
                {{ product.name }}
              </RouterLink>
            </h5>
            <p class="card-text" data-test-product-description>
              {{ product.description }}
            </p>
            <p class="card-text">
              Vendeur :
              <RouterLink
                data-test-product-seller
                :to="{ name: 'User', params: { userId: product.seller.id } }"
              >
                {{ product.seller.username }}
              </RouterLink>
            </p>
            <p class="card-text" data-test-product-date>
              En cours jusqu'au {{ formatDate(product.endDate) }}
            </p>
            <div v-if="product.bids.length > 0">
              <p class="card-text" data-test-product-price>
                Prix actuel :
                {{ bidUpperPrice(product) }} €
              </p>
            </div>
            <div v-if="product.bids.length == 0">
              <p class="card-text" data-test-product-price>
                Prix de départ : {{ product.originalPrice }} €
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
