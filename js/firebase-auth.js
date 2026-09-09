import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { firebaseConfig, USERNAME_MAP, DEFAULT_RECOVERY_EMAIL, CATEGORIES } from './firebase-config.js';
import { INDIA_GEOGRAPHY, getStatesList, getDistrictsForState, getCitiesForDistrict } from './india-geography.js';

// Initialize Firebase Production Services
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Client-Side Image Compression Helper (Max 360x360, Quality 0.75)
function compressImage(file, maxWidth = 360, maxHeight = 360, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export as compressed JPEG Base64 DataURL (~15-30 KB)
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Global Auth & Person Controller Class
export class JanMitraApp {
    constructor() {
        this.currentUser = null;
        this.records = []; // Production Firestore records array
        this.editingPersonId = null;
        this.deletingPersonId = null;
        this.expandedPersonId = null;
        this.selectedPhotoBase64 = ''; // Holds current Base64 image string

        this.initUI();
        this.initListeners();
        this.initGeographyDropdowns();
    }

    initUI() {
        this.loginScreen = document.getElementById('login-screen');
        this.appDashboard = document.getElementById('app-dashboard');
        this.loginForm = document.getElementById('login-form');
        this.usernameInput = document.getElementById('username-input');
        this.passwordInput = document.getElementById('password-input');
        this.loginBtn = document.getElementById('login-btn');
        this.authError = document.getElementById('auth-error');
        this.signOutBtn = document.getElementById('sign-out-btn');
        this.toastAlert = document.getElementById('toast-notification');
        
        // Forgot Password Elements
        this.forgotBtn = document.getElementById('forgot-password-btn');
        this.forgotModal = document.getElementById('forgot-modal');
        this.closeForgotBtn = document.getElementById('close-forgot-modal');
        this.sendResetBtn = document.getElementById('send-reset-btn');
        this.forgotStatus = document.getElementById('forgot-status');

        // Modal Views for Dashboard Actions
        this.addPersonModal = document.getElementById('add-person-modal');
        this.findPeopleModal = document.getElementById('find-people-modal');
        this.expandedPersonModal = document.getElementById('expanded-person-modal');
        this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
        this.addPersonForm = document.getElementById('add-person-form');
        this.formModalTitle = document.getElementById('person-form-modal-title');
        this.submitPersonBtn = document.getElementById('save-person-submit-btn');

        // Photo Upload Elements
        this.photoInput = document.getElementById('person-photo-input');
        this.selectPhotoBtn = document.getElementById('select-photo-btn');
        this.removePhotoBtn = document.getElementById('remove-photo-btn');
        this.photoPreviewImg = document.getElementById('person-photo-img');
        this.photoPlaceholderText = document.getElementById('photo-placeholder-text');

        // Add/Edit Location Elements
        this.personStateSelect = document.getElementById('person-state-input');
        this.personDistrictSelect = document.getElementById('person-district-input');
        this.personCityInput = document.getElementById('person-city-input');

        // Find People Filter Elements
        this.searchInput = document.getElementById('search-person-input');
        this.filterStateSelect = document.getElementById('filter-state-select');
        this.filterDistrictSelect = document.getElementById('filter-district-select');
        this.filterCitySelect = document.getElementById('filter-city-select');

        // Delete Confirm Controls
        this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');

        // Expanded View Actions
        this.expandedEditBtn = document.getElementById('expanded-edit-btn');
        this.expandedDeleteBtn = document.getElementById('expanded-delete-btn');
    }

    initListeners() {
        // Firebase Auth State Persistence
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.onLoginSuccess(user);
            } else {
                this.onLogoutSuccess();
            }
        });

        // Login Form Submit
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Sign Out Button
        if (this.signOutBtn) {
            this.signOutBtn.addEventListener('click', () => this.handleSignOut());
        }

        // Forgot Password Modal Handlers
        if (this.forgotBtn) {
            this.forgotBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotModal();
            });
        }

        if (this.closeForgotBtn) {
            this.closeForgotBtn.addEventListener('click', () => this.hideForgotModal());
        }

        if (this.sendResetBtn) {
            this.sendResetBtn.addEventListener('click', () => this.handleSendPasswordReset());
        }

        // Photo Upload Controls
        if (this.selectPhotoBtn && this.photoInput) {
            this.selectPhotoBtn.addEventListener('click', () => this.photoInput.click());
            this.photoInput.addEventListener('change', (e) => this.handlePhotoSelected(e));
        }

        if (this.removePhotoBtn) {
            this.removePhotoBtn.addEventListener('click', () => this.clearSelectedPhoto());
        }

        // Dashboard Primary Action Buttons
        const addPersonBtn = document.getElementById('action-add-person');
        const findPeopleBtn = document.getElementById('action-find-people');

        if (addPersonBtn) {
            addPersonBtn.addEventListener('click', () => this.openAddPersonModal());
        }

        if (findPeopleBtn) {
            findPeopleBtn.addEventListener('click', () => this.openFindPeopleModal());
        }

        // Add/Edit Person Form Cascading Location Handlers
        if (this.personStateSelect) {
            this.personStateSelect.addEventListener('change', (e) => {
                this.onFormStateChanged(e.target.value);
            });
        }

        if (this.personDistrictSelect) {
            this.personDistrictSelect.addEventListener('change', (e) => {
                this.onFormDistrictChanged(e.target.value);
            });
        }

        // Add/Edit Person Form Submit
        if (this.addPersonForm) {
            this.addPersonForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSavePerson();
            });
        }

        // Find People Cascading Filters Listeners
        const applyFilters = () => this.applyStructuredFilters();

        if (this.searchInput) this.searchInput.addEventListener('input', applyFilters);
        
        document.querySelectorAll('.filter-category-checkbox').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });

        if (this.filterStateSelect) {
            this.filterStateSelect.addEventListener('change', (e) => {
                this.onFilterStateChanged(e.target.value);
                applyFilters();
            });
        }

        if (this.filterDistrictSelect) {
            this.filterDistrictSelect.addEventListener('change', (e) => {
                this.onFilterDistrictChanged(e.target.value);
                applyFilters();
            });
        }

        if (this.filterCitySelect) {
            this.filterCitySelect.addEventListener('change', applyFilters);
        }

        // Expanded View Action Buttons
        if (this.expandedEditBtn) {
            this.expandedEditBtn.addEventListener('click', () => {
                if (this.expandedPersonId) {
                    const id = this.expandedPersonId;
                    this.closeExpandedModal();
                    this.openEditPersonModal(id);
                }
            });
        }

        if (this.expandedDeleteBtn) {
            this.expandedDeleteBtn.addEventListener('click', () => {
                if (this.expandedPersonId) {
                    const id = this.expandedPersonId;
                    this.closeExpandedModal();
                    this.confirmDeletePerson(id);
                }
            });
        }

        // Delete Confirmation Modal Listeners
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }

        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.executeDeletePerson());
        }

        // Modal Close and Cancel Triggers
        document.querySelectorAll('.modal-close-trigger, .modal-cancel-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.app-modal');
                if (modal) {
                    this.closeModal(modal);
                    if (modal === this.addPersonModal) {
                        this.resetPersonForm();
                    }
                }
            });
        });

        // Close Modal on Backdrop Click Outside Dialog Card
        document.querySelectorAll('.app-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                    if (modal === this.addPersonModal) {
                        this.resetPersonForm();
                    }
                }
            });
        });

        // Close Card Dropdown Menus on Outside Click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu-container')) {
                document.querySelectorAll('.card-dropdown-menu.active').forEach(m => m.classList.remove('active'));
            }
        });
    }

    openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        if (!document.querySelector('.app-modal.active')) {
            document.body.classList.remove('modal-open');
        }
    }

    // Handle Image Selection and Client-Side Compression
    async handlePhotoSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const compressedDataUrl = await compressImage(file, 360, 360, 0.75);
            this.setPhotoPreview(compressedDataUrl);
        } catch (err) {
            console.error("Image compression failed:", err);
            alert("Unable to process selected image.");
        }
    }

    setPhotoPreview(dataUrl) {
        this.selectedPhotoBase64 = dataUrl || '';
        if (dataUrl) {
            if (this.photoPreviewImg) {
                this.photoPreviewImg.src = dataUrl;
                this.photoPreviewImg.style.display = 'block';
            }
            if (this.photoPlaceholderText) this.photoPlaceholderText.style.display = 'none';
            if (this.removePhotoBtn) this.removePhotoBtn.style.display = 'inline-block';
        } else {
            this.clearSelectedPhoto();
        }
    }

    clearSelectedPhoto() {
        this.selectedPhotoBase64 = '';
        if (this.photoInput) this.photoInput.value = '';
        if (this.photoPreviewImg) {
            this.photoPreviewImg.src = '';
            this.photoPreviewImg.style.display = 'none';
        }
        if (this.photoPlaceholderText) this.photoPlaceholderText.style.display = 'block';
        if (this.removePhotoBtn) this.removePhotoBtn.style.display = 'none';
    }

    // Populate Master Geography (States/UTs)
    initGeographyDropdowns() {
        const states = getStatesList();
        
        if (this.personStateSelect) {
            this.personStateSelect.innerHTML = `<option value="">Select State/UT...</option>` +
                states.map(s => `<option value="${this.escapeHTML(s)}">${this.escapeHTML(s)}</option>`).join('');
        }

        if (this.filterStateSelect) {
            this.filterStateSelect.innerHTML = `<option value="">All States</option>` +
                states.map(s => `<option value="${this.escapeHTML(s)}">${this.escapeHTML(s)}</option>`).join('');
        }
    }

    // Add/Edit Form State Cascade
    onFormStateChanged(selectedState) {
        if (!selectedState) {
            this.personDistrictSelect.innerHTML = `<option value="">Select District...</option>`;
            this.personDistrictSelect.disabled = true;
            this.personCityInput.value = '';
            this.personCityInput.disabled = true;
            return;
        }

        const districts = getDistrictsForState(selectedState);
        this.personDistrictSelect.innerHTML = `<option value="">Select District...</option>` +
            districts.map(d => `<option value="${this.escapeHTML(d)}">${this.escapeHTML(d)}</option>`).join('');
        this.personDistrictSelect.disabled = false;
        
        this.personCityInput.value = '';
        this.personCityInput.disabled = true;
    }

    // Add/Edit Form District Cascade (Combines Static Geography Reference + Firestore Recorded Cities)
    onFormDistrictChanged(selectedDistrict) {
        const selectedState = this.personStateSelect.value;
        if (!selectedDistrict) {
            this.personCityInput.disabled = true;
            return;
        }

        this.personCityInput.disabled = false;
        
        // 1. Static City Reference Suggestions from LGD Data
        const staticCities = getCitiesForDistrict(selectedState, selectedDistrict);

        // 2. Existing Recorded Cities from Firestore
        const recordedCities = this.records
            .filter(r => r.state === selectedState && r.district === selectedDistrict && r.city)
            .map(r => r.city);

        // Combined Unique Cities List
        const allCitySuggestions = Array.from(new Set([...staticCities, ...recordedCities])).sort();

        const datalist = document.getElementById('known-cities-list');
        if (datalist) {
            datalist.innerHTML = allCitySuggestions.map(c => `<option value="${this.escapeHTML(c)}"></option>`).join('');
        }
    }

    // Filter Modal State Cascade
    onFilterStateChanged(selectedState) {
        if (!selectedState) {
            this.filterDistrictSelect.innerHTML = `<option value="">All Districts</option>`;
            this.filterDistrictSelect.disabled = true;
            this.filterCitySelect.innerHTML = `<option value="">All Cities/Towns</option>`;
            this.filterCitySelect.disabled = true;
            return;
        }

        const districts = getDistrictsForState(selectedState);
        this.filterDistrictSelect.innerHTML = `<option value="">All Districts</option>` +
            districts.map(d => `<option value="${this.escapeHTML(d)}">${this.escapeHTML(d)}</option>`).join('');
        this.filterDistrictSelect.disabled = false;

        this.filterCitySelect.innerHTML = `<option value="">All Cities/Towns</option>`;
        this.filterCitySelect.disabled = true;
    }

    // Filter Modal District Cascade (Combines Static LGD Cities + Recorded Firestore Cities)
    onFilterDistrictChanged(selectedDistrict) {
        const selectedState = this.filterStateSelect?.value;
        if (!selectedDistrict) {
            this.filterCitySelect.innerHTML = `<option value="">All Cities/Towns</option>`;
            this.filterCitySelect.disabled = true;
            return;
        }

        const staticCities = getCitiesForDistrict(selectedState, selectedDistrict);
        const recordedCities = this.records
            .filter(r => (!selectedState || r.state === selectedState) && r.district === selectedDistrict && r.city)
            .map(r => r.city);

        const cities = Array.from(new Set([...staticCities, ...recordedCities])).sort();

        this.filterCitySelect.innerHTML = `<option value="">All Cities/Towns</option>` +
            cities.map(c => `<option value="${this.escapeHTML(c)}">${this.escapeHTML(c)}</option>`).join('');
        this.filterCitySelect.disabled = false;
    }

    // Resolve Username to Auth Email
    resolveEmail(usernameInput) {
        const clean = (usernameInput || '').trim().toLowerCase();
        if (USERNAME_MAP[clean]) {
            return USERNAME_MAP[clean];
        }
        if (clean.includes('@')) {
            return clean;
        }
        return DEFAULT_RECOVERY_EMAIL;
    }

    async handleLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        this.showError('');
        if (!username || !password) {
            this.showError('Please enter both username and password.');
            return;
        }

        const email = this.resolveEmail(username);

        this.setLoading(true, 'Authenticating...');

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            this.setLoading(false);
            console.error("Authentication Error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                this.showError('Incorrect username or password. Please try again.');
            } else if (err.code === 'auth/too-many-requests') {
                this.showError('Access temporarily blocked due to multiple attempts. Please try again later.');
            } else {
                this.showError('Authentication failed. Please check your credentials.');
            }
        }
    }

    async handleSignOut() {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Sign out error:", err);
        }
        this.onLogoutSuccess();
    }

    showForgotModal() {
        if (this.forgotModal) {
            this.openModal(this.forgotModal);
            if (this.forgotStatus) this.forgotStatus.textContent = '';
        }
    }

    hideForgotModal() {
        if (this.forgotModal) {
            this.closeModal(this.forgotModal);
        }
    }

    async handleSendPasswordReset() {
        const usernameVal = this.usernameInput.value.trim();
        const targetEmail = this.resolveEmail(usernameVal);

        if (this.forgotStatus) {
            this.forgotStatus.innerHTML = `<span class="status-loading">Sending password reset email to authorized address...</span>`;
        }

        try {
            await sendPasswordResetEmail(auth, targetEmail);
            if (this.forgotStatus) {
                this.forgotStatus.innerHTML = `
                    <div class="status-success">
                        ✓ Password reset email successfully sent to <strong>${targetEmail}</strong>. 
                        Please check your inbox.
                    </div>
                `;
            }
        } catch (err) {
            console.error("Reset email error:", err);
            if (this.forgotStatus) {
                this.forgotStatus.innerHTML = `<div class="status-error">Error sending reset link: ${err.message}</div>`;
            }
        }
    }

    async onLoginSuccess(user) {
        this.currentUser = user;
        this.setLoading(false);

        if (this.loginScreen) this.loginScreen.style.display = 'none';
        if (this.appDashboard) {
            this.appDashboard.style.display = 'flex';
            this.appDashboard.classList.add('fade-in');
        }

        const userDisplay = document.getElementById('current-user-display');
        if (userDisplay) {
            userDisplay.textContent = 'janmitra';
        }

        await this.fetchPersonRecords();
    }

    onLogoutSuccess() {
        this.currentUser = null;
        this.records = [];

        if (this.appDashboard) this.appDashboard.style.display = 'none';
        if (this.loginScreen) {
            this.loginScreen.style.display = 'flex';
            this.loginScreen.classList.add('fade-in');
        }

        if (this.passwordInput) this.passwordInput.value = '';
        this.showError('');
    }

    setLoading(loading, message = 'Logging in...') {
        if (!this.loginBtn) return;
        if (loading) {
            this.loginBtn.disabled = true;
            this.loginBtn.innerHTML = `<span class="spinner"></span> ${message}`;
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.innerHTML = `LOGIN`;
        }
    }

    showError(msg) {
        if (!this.authError) return;
        if (msg) {
            this.authError.textContent = msg;
            this.authError.style.display = 'block';
        } else {
            this.authError.textContent = '';
            this.authError.style.display = 'none';
        }
    }

    showToast(message, type = 'success') {
        if (!this.toastAlert) return;
        this.toastAlert.textContent = message;
        this.toastAlert.className = `toast-notification toast-${type} active`;
        setTimeout(() => {
            this.toastAlert.classList.remove('active');
        }, 3000);
    }

    // Open Add Person Modal
    openAddPersonModal() {
        this.resetPersonForm();
        this.editingPersonId = null;
        if (this.formModalTitle) this.formModalTitle.textContent = "Add Person";
        if (this.submitPersonBtn) this.submitPersonBtn.textContent = "Save Person Record";
        if (this.addPersonModal) this.openModal(this.addPersonModal);
    }

    // Open Edit Person Modal
    openEditPersonModal(personId) {
        const person = this.records.find(r => r.id === personId);
        if (!person) return;

        this.editingPersonId = personId;
        if (this.formModalTitle) this.formModalTitle.textContent = "Edit Person";
        if (this.submitPersonBtn) this.submitPersonBtn.textContent = "Update Person Record";

        // Pre-populate Text Fields
        document.getElementById('person-name-input').value = person.name || '';
        document.getElementById('person-contact-input').value = person.contact || '';
        document.getElementById('person-date-input').value = person.date || '';
        document.getElementById('person-context-input').value = person.context || '';
        document.getElementById('person-notes-input').value = person.notes || '';

        // Pre-populate Photo
        if (person.photograph) {
            this.setPhotoPreview(person.photograph);
        } else {
            this.clearSelectedPhoto();
        }

        // Pre-select Category Checkboxes
        document.querySelectorAll('#add-person-modal .category-checkbox').forEach(cb => {
            cb.checked = (person.categories || []).includes(cb.value);
        });

        // Pre-select State, District, City
        if (person.state) {
            this.personStateSelect.value = person.state;
            this.onFormStateChanged(person.state);

            if (person.district) {
                this.personDistrictSelect.value = person.district;
                this.onFormDistrictChanged(person.district);

                if (person.city) {
                    this.personCityInput.value = person.city;
                }
            }
        } else {
            this.personStateSelect.value = '';
            this.onFormStateChanged('');
        }

        if (this.addPersonModal) this.openModal(this.addPersonModal);
    }

    resetPersonForm() {
        if (this.addPersonForm) this.addPersonForm.reset();
        this.clearSelectedPhoto();
        document.querySelectorAll('#add-person-modal .category-checkbox').forEach(cb => cb.checked = false);
        if (this.personStateSelect) this.personStateSelect.value = '';
        this.onFormStateChanged('');
        this.editingPersonId = null;
    }

    // Expanded Person View Modal
    openExpandedPersonModal(personId) {
        const person = this.records.find(r => r.id === personId);
        if (!person) return;

        this.expandedPersonId = personId;

        // Avatar Box
        const avatarBox = document.getElementById('expanded-avatar-box');
        if (avatarBox) {
            if (person.photograph) {
                avatarBox.innerHTML = `<img src="${person.photograph}" class="expanded-photo-img" alt="${this.escapeHTML(person.name)}">`;
            } else {
                avatarBox.innerHTML = `<div class="expanded-avatar-initial">${(person.name || 'P').charAt(0).toUpperCase()}</div>`;
            }
        }

        // Name & Origin
        const nameEl = document.getElementById('expanded-person-name');
        if (nameEl) nameEl.textContent = person.name || 'Unnamed Person';

        const originEl = document.getElementById('expanded-person-origin');
        if (originEl) {
            originEl.textContent = (person.city || person.state || person.district) 
                ? `📍 ${person.city || ''}${person.district ? ', ' + person.district : ''}${person.state ? ', ' + person.state : ''}`
                : '';
        }

        // Details
        const contactEl = document.getElementById('expanded-person-contact');
        if (contactEl) contactEl.textContent = person.contact || 'Not recorded';

        const dateEl = document.getElementById('expanded-person-date');
        if (dateEl) dateEl.textContent = person.date || 'Not recorded';

        const tagsContainer = document.getElementById('expanded-person-tags');
        if (tagsContainer) {
            if (person.categories && person.categories.length > 0) {
                tagsContainer.innerHTML = person.categories.map(c => `<span class="category-tag">${this.escapeHTML(c)}</span>`).join('');
            } else {
                tagsContainer.innerHTML = `<span class="detail-value">No categories assigned</span>`;
            }
        }

        const locationEl = document.getElementById('expanded-person-location');
        if (locationEl) {
            locationEl.textContent = (person.state || person.district || person.city)
                ? `${person.city ? person.city + ', ' : ''}${person.district ? person.district + ', ' : ''}${person.state || ''}`
                : 'Not recorded';
        }

        const contextEl = document.getElementById('expanded-person-context');
        if (contextEl) contextEl.textContent = person.context ? `"${person.context}"` : 'No context recorded.';

        const notesEl = document.getElementById('expanded-person-notes');
        if (notesEl) notesEl.textContent = person.notes || 'No notes recorded.';

        if (this.expandedPersonModal) this.openModal(this.expandedPersonModal);
    }

    closeExpandedModal() {
        this.expandedPersonId = null;
        if (this.expandedPersonModal) this.closeModal(this.expandedPersonModal);
    }

    openFindPeopleModal() {
        if (this.findPeopleModal) {
            this.openModal(this.findPeopleModal);
            this.resetFilters();
            this.renderFindPeopleList(this.records);
        }
    }

    // Firestore CRUD Operations
    async fetchPersonRecords() {
        const container = document.getElementById('recent-records-container');
        if (!container) return;

        container.innerHTML = `<div class="records-loading">Fetching records...</div>`;

        try {
            const q = query(collection(db, 'persons'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            this.records = [];
            querySnapshot.forEach((docSnap) => {
                this.records.push({ id: docSnap.id, ...docSnap.data() });
            });

            this.renderRecordsList(this.records);
        } catch (err) {
            console.error("Error fetching persons from Firestore:", err);
            this.renderRecordsList([]);
        }
    }

    // Save or Update Person Record
    async handleSavePerson() {
        const name = document.getElementById('person-name-input')?.value.trim();
        const contact = document.getElementById('person-contact-input')?.value.trim() || '';
        const date = document.getElementById('person-date-input')?.value || '';
        const state = document.getElementById('person-state-input')?.value || '';
        const district = document.getElementById('person-district-input')?.value || '';
        const city = document.getElementById('person-city-input')?.value.trim() || '';
        
        // Multi-select Categories
        const checkedCategories = Array.from(document.querySelectorAll('#add-person-modal .category-checkbox:checked')).map(cb => cb.value);

        const context = document.getElementById('person-context-input')?.value.trim() || '';
        const notes = document.getElementById('person-notes-input')?.value.trim() || '';

        if (!name) return;

        const personData = {
            name,
            contact,
            photograph: this.selectedPhotoBase64 || '',
            date,
            state,
            district,
            city,
            categories: checkedCategories,
            context,
            notes
        };

        const submitBtn = this.addPersonForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            if (this.editingPersonId) {
                await updateDoc(doc(db, 'persons', this.editingPersonId), personData);
                this.showToast('✓ Person record updated successfully.');
            } else {
                personData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'persons'), personData);
                this.showToast('✓ New person record saved.');
            }

            if (this.addPersonModal) this.closeModal(this.addPersonModal);
            this.resetPersonForm();
            await this.fetchPersonRecords();
        } catch (err) {
            console.error("Error saving person record:", err);
            alert("Error saving record: " + (err.message || "Permission denied or network error."));
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }

    // Delete Modal Actions
    confirmDeletePerson(personId) {
        this.deletingPersonId = personId;
        if (this.deleteConfirmModal) {
            this.openModal(this.deleteConfirmModal);
        }
    }

    closeDeleteModal() {
        this.deletingPersonId = null;
        if (this.deleteConfirmModal) {
            this.closeModal(this.deleteConfirmModal);
        }
    }

    async executeDeletePerson() {
        if (!this.deletingPersonId) return;

        try {
            await deleteDoc(doc(db, 'persons', this.deletingPersonId));
            this.closeDeleteModal();
            this.showToast('✓ Record deleted successfully.');
            await this.fetchPersonRecords();
        } catch (err) {
            console.error("Error deleting person record:", err);
            alert("Error deleting record: " + (err.message || "Permission denied."));
        }
    }

    renderRecordsList(records) {
        const container = document.getElementById('recent-records-container');
        if (!container) return;

        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="empty-records-state">
                    <div class="empty-icon">🌱</div>
                    <p class="empty-title">No Person Records Found</p>
                    <p class="empty-desc">No individuals have been recorded yet. Click <strong>+ ADD PERSON</strong> above to preserve a new person record.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = records.map(person => `
            <div class="person-card" data-id="${person.id}" onclick="window.janMitraApp.openExpandedPersonModal('${person.id}')">
                <div class="person-avatar-placeholder">
                    ${person.photograph 
                        ? `<img src="${person.photograph}" class="card-thumb-img" alt="${this.escapeHTML(person.name)}">`
                        : (person.name || 'P').charAt(0).toUpperCase()
                    }
                </div>
                <div class="person-details">
                    <div class="person-title-bar">
                        <h4 class="person-name">${this.escapeHTML(person.name)}</h4>
                        
                        <!-- Subtle Overflow Menu -->
                        <div class="card-menu-container">
                            <button type="button" class="card-menu-btn" aria-label="Options" onclick="window.janMitraApp.toggleCardMenu(event, '${person.id}')">⋮</button>
                            <div id="menu-${person.id}" class="card-dropdown-menu">
                                <button type="button" class="dropdown-item" onclick="event.stopPropagation(); window.janMitraApp.openEditPersonModal('${person.id}')">✏️ Edit Person</button>
                                <button type="button" class="dropdown-item item-delete" onclick="event.stopPropagation(); window.janMitraApp.confirmDeletePerson('${person.id}')">🗑️ Delete Person</button>
                            </div>
                        </div>
                    </div>

                    ${(person.city || person.state || person.district) ? `<p class="person-origin">📍 ${this.escapeHTML(person.city || '')}${person.district ? ', ' + this.escapeHTML(person.district) : ''}${person.state ? ', ' + this.escapeHTML(person.state) : ''}</p>` : ''}
                    ${person.context ? `<p class="person-context">"${this.escapeHTML(person.context)}"</p>` : ''}
                    ${(person.categories && person.categories.length > 0) ? `
                        <div class="person-tags">
                            ${person.categories.map(c => `<span class="category-tag">${this.escapeHTML(c)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    toggleCardMenu(event, personId) {
        event.stopPropagation();
        const menu = document.getElementById(`menu-${personId}`);
        if (!menu) return;

        const isCurrentlyActive = menu.classList.contains('active');
        document.querySelectorAll('.card-dropdown-menu.active').forEach(m => m.classList.remove('active'));

        if (!isCurrentlyActive) {
            menu.classList.add('active');
        }
    }

    resetFilters() {
        if (this.searchInput) this.searchInput.value = '';
        document.querySelectorAll('.filter-category-checkbox').forEach(cb => cb.checked = false);
        if (this.filterStateSelect) this.filterStateSelect.value = '';
        this.onFilterStateChanged('');
    }

    // Structured Combined Filter Logic (Multi-category OR + State/District/City AND)
    applyStructuredFilters() {
        const searchTerm = (this.searchInput?.value || '').trim().toLowerCase();
        
        // Selected Category Filter Checkboxes (OR logic)
        const selectedCategories = Array.from(document.querySelectorAll('.filter-category-checkbox:checked')).map(cb => cb.value);

        const stateVal = this.filterStateSelect?.value || '';
        const districtVal = this.filterDistrictSelect?.value || '';
        const cityVal = this.filterCitySelect?.value || '';

        const filtered = this.records.filter(p => {
            // 1. Text Search (matches Name, Context, or Notes)
            if (searchTerm) {
                const nameMatch = (p.name || '').toLowerCase().includes(searchTerm);
                const contextMatch = (p.context || '').toLowerCase().includes(searchTerm);
                const notesMatch = (p.notes || '').toLowerCase().includes(searchTerm);
                if (!nameMatch && !contextMatch && !notesMatch) return false;
            }

            // 2. Multi-category Filter (OR Logic within categories)
            if (selectedCategories.length > 0) {
                const hasMatchingCategory = (p.categories || []).some(c => selectedCategories.includes(c));
                if (!hasMatchingCategory) return false;
            }

            // 3. State Filter (AND Logic)
            if (stateVal && p.state !== stateVal) {
                return false;
            }

            // 4. District Filter (AND Logic)
            if (districtVal && p.district !== districtVal) {
                return false;
            }

            // 5. City Filter (AND Logic)
            if (cityVal && p.city !== cityVal) {
                return false;
            }

            return true;
        });

        this.renderFindPeopleList(filtered);
    }

    renderFindPeopleList(recordsList) {
        const listContainer = document.getElementById('search-results-list');
        if (!listContainer) return;

        if (!recordsList || recordsList.length === 0) {
            listContainer.innerHTML = `<p class="no-search-results">No matching person records found.</p>`;
            return;
        }

        listContainer.innerHTML = recordsList.map(person => `
            <div class="search-result-item" onclick="window.janMitraApp.openExpandedPersonModal('${person.id}')">
                <div class="result-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${person.photograph 
                            ? `<img src="${person.photograph}" class="result-thumb-img" alt="${this.escapeHTML(person.name)}">`
                            : ''
                        }
                        <strong>${this.escapeHTML(person.name)}</strong>
                    </div>
                    <span class="result-location">${this.escapeHTML(person.city || '')}${person.district ? ', ' + this.escapeHTML(person.district) : ''}${person.state ? ' (' + this.escapeHTML(person.state) + ')' : ''}</span>
                </div>
                ${(person.categories && person.categories.length > 0) ? `
                    <div class="person-tags" style="margin-top: 4px;">
                        ${person.categories.map(c => `<span class="category-tag">${this.escapeHTML(c)}</span>`).join('')}
                    </div>
                ` : ''}
                ${person.context ? `<p class="result-meta" style="margin-top: 6px;">"${this.escapeHTML(person.context)}"</p>` : ''}
            </div>
        `).join('');
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Auto-instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.janMitraApp = new JanMitraApp();
});
