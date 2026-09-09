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
import { INDIA_GEOGRAPHY, getStatesList, getDistrictsForState } from './india-geography.js';

// Initialize Firebase Production Services
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Auth & Person Controller Class
export class JanMitraApp {
    constructor() {
        this.currentUser = null;
        this.records = []; // Production Firestore records array
        this.editingPersonId = null;
        this.deletingPersonId = null;

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
        this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
        this.addPersonForm = document.getElementById('add-person-form');
        this.formModalTitle = document.getElementById('person-form-modal-title');
        this.submitPersonBtn = document.getElementById('save-person-submit-btn');

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

        // Delete Confirmation Modal Listeners
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }

        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.executeDeletePerson());
        }

        // Modal Close Buttons
        document.querySelectorAll('.modal-close-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.app-modal');
                if (modal) {
                    modal.classList.remove('active');
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

    // Add/Edit Form District Cascade
    onFormDistrictChanged(selectedDistrict) {
        if (!selectedDistrict) {
            this.personCityInput.disabled = true;
            return;
        }

        this.personCityInput.disabled = false;
        
        // Populate known recorded cities datalist for this district
        const knownCities = Array.from(new Set(
            this.records
                .filter(r => r.state === this.personStateSelect.value && r.district === selectedDistrict && r.city)
                .map(r => r.city)
        )).sort();

        const datalist = document.getElementById('known-cities-list');
        if (datalist) {
            datalist.innerHTML = knownCities.map(c => `<option value="${this.escapeHTML(c)}"></option>`).join('');
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

    // Filter Modal District Cascade
    onFilterDistrictChanged(selectedDistrict) {
        const selectedState = this.filterStateSelect?.value;
        if (!selectedDistrict) {
            this.filterCitySelect.innerHTML = `<option value="">All Cities/Towns</option>`;
            this.filterCitySelect.disabled = true;
            return;
        }

        const cities = Array.from(new Set(
            this.records
                .filter(r => (!selectedState || r.state === selectedState) && r.district === selectedDistrict && r.city)
                .map(r => r.city)
        )).sort();

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
            this.forgotModal.classList.add('active');
            if (this.forgotStatus) this.forgotStatus.textContent = '';
        }
    }

    hideForgotModal() {
        if (this.forgotModal) {
            this.forgotModal.classList.remove('active');
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
        if (this.addPersonModal) this.addPersonModal.classList.add('active');
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

        if (this.addPersonModal) this.addPersonModal.classList.add('active');
    }

    resetPersonForm() {
        if (this.addPersonForm) this.addPersonForm.reset();
        document.querySelectorAll('#add-person-modal .category-checkbox').forEach(cb => cb.checked = false);
        if (this.personStateSelect) this.personStateSelect.value = '';
        this.onFormStateChanged('');
        this.editingPersonId = null;
    }

    openFindPeopleModal() {
        if (this.findPeopleModal) {
            this.findPeopleModal.classList.add('active');
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
            photograph: '',
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
                // Update existing record
                await updateDoc(doc(db, 'persons', this.editingPersonId), personData);
                this.showToast('✓ Person record updated successfully.');
            } else {
                // Create new record
                personData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'persons'), personData);
                this.showToast('✓ New person record saved.');
            }

            if (this.addPersonModal) this.addPersonModal.classList.remove('active');
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
            this.deleteConfirmModal.classList.add('active');
        }
    }

    closeDeleteModal() {
        this.deletingPersonId = null;
        if (this.deleteConfirmModal) {
            this.deleteConfirmModal.classList.remove('active');
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
            <div class="person-card" data-id="${person.id}">
                <div class="person-avatar-placeholder">
                    ${(person.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div class="person-details">
                    <div class="person-title-bar">
                        <h4 class="person-name">${this.escapeHTML(person.name)}</h4>
                        
                        <!-- Subtle Overflow Menu -->
                        <div class="card-menu-container">
                            <button type="button" class="card-menu-btn" aria-label="Options" onclick="window.janMitraApp.toggleCardMenu(event, '${person.id}')">⋮</button>
                            <div id="menu-${person.id}" class="card-dropdown-menu">
                                <button type="button" class="dropdown-item" onclick="window.janMitraApp.openEditPersonModal('${person.id}')">✏️ Edit Person</button>
                                <button type="button" class="dropdown-item item-delete" onclick="window.janMitraApp.confirmDeletePerson('${person.id}')">🗑️ Delete Person</button>
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
            <div class="search-result-item">
                <div class="result-header">
                    <strong>${this.escapeHTML(person.name)}</strong>
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
