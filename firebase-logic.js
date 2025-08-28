// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// ===============================================================================================
// === PEGA AQUÍ TU CÓDIGO DE CONFIGURACIÓN DE FIREBASE ===
// ===============================================================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhwPD0X-arQRXK2jt6qUBf6wOoJHB28dw",
  authDomain: "talento-2e551.firebaseapp.com",
  projectId: "talento-2e551",
  storageBucket: "talento-2e551.firebasestorage.app",
  messagingSenderId: "827147135201",
  appId: "1:827147135201:web:b31e3382713f48dc10efa0",
  measurementId: "G-ZYPESZ9T7C"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === GLOBAL VARIABLES ===
let allOffers = []; // Holds all offers to enable client-side searching

// === LOGIC FOR INDEX.HTML ===

/**
 * Fetches all offers from Firestore and displays them on the main page.
 */
async function loadAndDisplayOffers() {
    const offersList = document.getElementById('offersList');
    const noOffersMessage = document.getElementById('noOffersMessage');
    
    if (!offersList) return; // Don't run this code if we're not on index.html

    try {
        const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allOffers = []; // Clear previous offers
        querySnapshot.forEach((doc) => {
            allOffers.push({ id: doc.id, data: doc.data() });
        });

        displayOffers(allOffers);
    } catch (error) {
        console.error("Error loading offers: ", error);
        noOffersMessage.innerHTML = "Error al cargar las ofertas. Revisa la consola (F12) para más detalles.";
        noOffersMessage.classList.remove('hidden');
    }
}

/**
 * Renders an array of offers to the DOM.
 * @param {Array} offersToDisplay The offers to show.
 */
function displayOffers(offersToDisplay) {
    const offersList = document.getElementById('offersList');
    const noOffersMessage = document.getElementById('noOffersMessage');
    offersList.innerHTML = '';

    if (offersToDisplay.length === 0) {
        noOffersMessage.classList.remove('hidden');
    } else {
        noOffersMessage.classList.add('hidden');
        offersToDisplay.forEach(offer => {
            const offerCard = `
                <div class="card p-5 flex flex-col justify-between">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 mb-1">${offer.data.clubName}</h2>
                        <h3 class="text-lg font-semibold text-accent mb-3">${offer.data.title}</h3>
                        <div class="flex flex-wrap gap-2 mb-4">
                            <span class="tag">${offer.data.category}</span>
                            <span class="tag">${offer.data.position}</span>
                        </div>
                        <p class="text-gray-600 mb-4 text-sm leading-relaxed">${offer.data.description}</p>
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        <a href="mailto:${offer.data.contactEmail}" class="w-full text-center py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                            <i class="fas fa-envelope mr-2"></i> Contactar Club
                        </a>
                        <button onclick="deleteOffer('${offer.id}')" class="delete-btn w-full text-center py-2 px-4 rounded-lg font-semibold mt-2">
                            <i class="fas fa-trash-alt mr-1"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            offersList.innerHTML += offerCard;
        });
    }
}

/**
 * Deletes an offer from Firestore.
 * @param {string} offerId The ID of the document to delete.
 */
async function deleteOffer(offerId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta oferta? Esta acción es irreversible.')) {
        try {
            await deleteDoc(doc(db, "offers", offerId));
            loadAndDisplayOffers(); // Refresh the list after deleting
        } catch (error) {
            console.error("Error deleting offer: ", error);
            alert("No se pudo eliminar la oferta.");
        }
    }
}

// === LOGIC FOR PUBLISH.HTML ===

/**
 * Gathers data from the form and saves it to Firestore.
 */
async function publishOffer() {
    const clubName = document.getElementById('club-name').value.trim();
    const contactEmail = document.getElementById('contact-email').value.trim();
    const title = document.getElementById('offer-title').value.trim();
    const category = document.getElementById('offer-category').value;
    const position = document.getElementById('offer-position').value;
    const description = document.getElementById('offer-description').value.trim();

    // Simple validation
    if (!clubName || !contactEmail || !title || !category || !position || !description) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    try {
        await addDoc(collection(db, "offers"), {
            clubName, contactEmail, title, category, position, description,
            createdAt: serverTimestamp()
        });
        alert('¡Oferta publicada con éxito!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Error publishing offer: ", error);
        alert('Hubo un error al publicar la oferta.');
    }
}

// === EVENT LISTENERS & INITIALIZATION ===

// Make functions globally available so inline `onclick` attributes work
window.deleteOffer = deleteOffer;

// Check which page we are on and run the appropriate code
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('offersList')) {
        // We are on index.html
        loadAndDisplayOffers();
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const filtered = allOffers.filter(offer => 
                offer.data.clubName.toLowerCase().includes(searchTerm) ||
                offer.data.title.toLowerCase().includes(searchTerm) ||
                offer.data.position.toLowerCase().includes(searchTerm) ||
                offer.data.category.toLowerCase().includes(searchTerm)
            );
            displayOffers(filtered);
        });
    }

    if (document.getElementById('publish-button')) {
        // We are on publish.html
        document.getElementById('publish-button').addEventListener('click', publishOffer);
    }
});