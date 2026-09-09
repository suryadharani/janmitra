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
    query, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { firebaseConfig, USERNAME_MAP, DEFAULT_RECOVERY_EMAIL, CATEGORIES } from './firebase-config.js';

// Initialize Firebase Production Services
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Auth & Person Controller Class
export class JanMitraApp {
    constructor() {
        this.currentUser = null;
        this.records = []; // Production Firestore records array

        this.initUI();
        this.initListeners();
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
        
        // Forgot Password Elements
        this.forgotBtn = document.getElementById('forgot-password-btn');
        this.forgotModal = document.getElementById('forgot-modal');
        this.closeForgotBtn = document.getElementById('close-forgot-modal');
        this.sendResetBtn = document.getElementById('send-reset-btn');
        this.forgotStatus = document.getElementById('forgot-status');

        // Modal Views for Dashboard Actions
        this.addPersonModal = document.getElementById('add-person-modal');
        this.findPeopleModal = document.getElementById('find-people-modal');
        this.addPersonForm = document.getElementById('add-person-form');
        this.searchInput = document.getElementById('search-person-input');
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

        // Add Person Form Submit
        if (this.addPersonForm) {
            this.addPersonForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreatePerson();
            });
        }

        // Search Input Filtering
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterFindPeopleList(e.target.value);
            });
        }

        // Modal Close Buttons
        document.querySelectorAll('.modal-close-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.app-modal');
                if (modal) modal.classList.remove('active');
            });
        });
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
            // Firebase Auth listener (onAuthStateChanged) switches view on success
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

        // Hide Login Screen, Show Dashboard
        if (this.loginScreen) this.loginScreen.style.display = 'none';
        if (this.appDashboard) {
            this.appDashboard.style.display = 'flex';
            this.appDashboard.classList.add('fade-in');
        }

        const userDisplay = document.getElementById('current-user-display');
        if (userDisplay) {
            userDisplay.textContent = 'janmitra';
        }

        // Fetch real production records from Firestore /persons collection
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

    // Modal Actions
    openAddPersonModal() {
        if (this.addPersonModal) {
            this.addPersonModal.classList.add('active');
        }
    }

    openFindPeopleModal() {
        if (this.findPeopleModal) {
            this.findPeopleModal.classList.add('active');
            if (this.searchInput) this.searchInput.value = '';
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
            querySnapshot.forEach((doc) => {
                this.records.push({ id: doc.id, ...doc.data() });
            });

            this.renderRecordsList(this.records);
        } catch (err) {
            console.error("Error fetching persons from Firestore:", err);
            // If empty or initial state
            this.renderRecordsList([]);
        }
    }

    async handleCreatePerson() {
        const name = document.getElementById('person-name-input')?.value.trim();
        const contact = document.getElementById('person-contact-input')?.value.trim() || '';
        const date = document.getElementById('person-date-input')?.value || '';
        const state = document.getElementById('person-state-input')?.value.trim() || '';
        const district = document.getElementById('person-district-input')?.value.trim() || '';
        const city = document.getElementById('person-city-input')?.value.trim() || '';
        const categorySelect = document.getElementById('person-category-input');
        const category = categorySelect ? categorySelect.value : '';
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
            categories: category ? [category] : [],
            context,
            notes,
            createdAt: serverTimestamp()
        };

        const submitBtn = this.addPersonForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            await addDoc(collection(db, 'persons'), personData);
            if (this.addPersonModal) this.addPersonModal.classList.remove('active');
            if (this.addPersonForm) this.addPersonForm.reset();
            await this.fetchPersonRecords();
        } catch (err) {
            console.error("Error saving person record to Firestore:", err);
            alert("Error saving record: " + (err.message || "Permission denied or network error."));
        } finally {
            if (submitBtn) submitBtn.disabled = false;
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
            <div class="person-card">
                <div class="person-avatar-placeholder">
                    ${(person.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div class="person-details">
                    <h4 class="person-name">${this.escapeHTML(person.name)}</h4>
                    ${(person.city || person.state) ? `<p class="person-origin">📍 ${this.escapeHTML(person.city || '')}${person.district ? ', ' + this.escapeHTML(person.district) : ''}${person.state ? ', ' + this.escapeHTML(person.state) : ''}</p>` : ''}
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

    filterFindPeopleList(searchTerm) {
        const term = (searchTerm || '').trim().toLowerCase();
        if (!term) {
            this.renderFindPeopleList(this.records);
            return;
        }

        const filtered = this.records.filter(p => {
            const nameMatch = (p.name || '').toLowerCase().includes(term);
            const cityMatch = (p.city || '').toLowerCase().includes(term);
            const districtMatch = (p.district || '').toLowerCase().includes(term);
            const stateMatch = (p.state || '').toLowerCase().includes(term);
            const catMatch = (p.categories || []).some(c => c.toLowerCase().includes(term));
            return nameMatch || cityMatch || districtMatch || stateMatch || catMatch;
        });

        this.renderFindPeopleList(filtered);
    }

    renderFindPeopleList(recordsList) {
        const listContainer = document.getElementById('search-results-list');
        if (!listContainer) return;

        if (!recordsList || recordsList.length === 0) {
            listContainer.innerHTML = `<p class="no-search-results">No matching records found.</p>`;
            return;
        }

        listContainer.innerHTML = recordsList.map(person => `
            <div class="search-result-item">
                <div class="result-header">
                    <strong>${this.escapeHTML(person.name)}</strong>
                    <span class="result-location">${this.escapeHTML(person.city || '')} ${person.state ? '(' + this.escapeHTML(person.state) + ')' : ''}</span>
                </div>
                ${person.context ? `<p class="result-meta">${this.escapeHTML(person.context)}</p>` : ''}
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
