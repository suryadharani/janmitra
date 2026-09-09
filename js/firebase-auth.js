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

import { firebaseConfig, USERNAME_MAP, DEFAULT_RECOVERY_EMAIL } from './firebase-config.js';

// Initialize Firebase App securely
let app, auth, db;
let isConfigured = false;

try {
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("Placeholder")) {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isConfigured = true;
    }
} catch (err) {
    console.warn("JanMitra Firebase init note:", err);
}

// Global Auth Controller Class
export class JanMitraApp {
    constructor() {
        this.currentUser = null;
        this.samplePersons = [
            {
                id: 'demo-1',
                name: 'Sri Ananda Sharma',
                contact: '+91 98765 43210',
                photograph: '',
                date: '2026-03-15',
                state: 'Andhra Pradesh',
                district: 'Guntur',
                city: 'Tenali',
                categories: ['Vedic Scholar', 'Devotee Sevak'],
                context: 'Met during the annual Mahashivratri Seva at Srisailam.',
                notes: 'A deeply learned scholar in Krishna Yajurveda.'
            },
            {
                id: 'demo-2',
                name: 'Gurudev Ramnath Maharaj',
                contact: 'ramnath.seva@email.org',
                photograph: '',
                date: '2026-06-21',
                state: 'Uttarakhand',
                district: 'Rishikesh',
                city: 'Tapovan',
                categories: ['Yogi', 'Spiritual Guide'],
                context: 'Shared quiet dialogue at the banks of Ganga regarding Dhyana practices.',
                notes: 'Resides at Tapovan Ashram.'
            }
        ];

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
    }

    initListeners() {
        // Firebase Auth State Persistence
        if (isConfigured && auth) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    this.onLoginSuccess(user);
                } else {
                    this.onLogoutSuccess();
                }
            });
        }

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

        if (isConfigured && auth) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Auth state listener handles UI switch
            } catch (err) {
                this.setLoading(false);
                console.error("Login failed:", err);
                if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                    this.showError('Incorrect username or password. Please try again.');
                } else if (err.code === 'auth/too-many-requests') {
                    this.showError('Access temporarily blocked due to multiple attempts. Please try again later.');
                } else {
                    this.showError(`Authentication note: ${err.message || 'Unable to log in.'}`);
                }
            }
        } else {
            // Local preview mode if Firebase API key is pending configuration
            setTimeout(() => {
                this.setLoading(false);
                if (password.length >= 6) {
                    this.onLoginSuccess({ email, uid: 'local-swamiji-demo' });
                } else {
                    this.showError('Password must be at least 6 characters.');
                }
            }, 800);
        }
    }

    async handleSignOut() {
        if (isConfigured && auth) {
            try {
                await signOut(auth);
            } catch (err) {
                console.error("Sign out error:", err);
            }
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

        if (isConfigured && auth) {
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
        } else {
            setTimeout(() => {
                if (this.forgotStatus) {
                    this.forgotStatus.innerHTML = `
                        <div class="status-success">
                            ✓ [Preview Mode] Password reset trigger sent to <strong>${targetEmail}</strong>.
                        </div>
                    `;
                }
            }, 600);
        }
    }

    onLoginSuccess(user) {
        this.currentUser = user;
        this.setLoading(false);

        // Hide Login Screen, Show Application Dashboard
        if (this.loginScreen) this.loginScreen.style.display = 'none';
        if (this.appDashboard) {
            this.appDashboard.style.display = 'flex';
            this.appDashboard.classList.add('fade-in');
        }

        // Update User Indicator
        const userDisplay = document.getElementById('current-user-display');
        if (userDisplay) {
            userDisplay.textContent = 'janmitra';
        }

        this.renderSampleRecords();
    }

    onLogoutSuccess() {
        this.currentUser = null;

        // Hide Application Dashboard, Show Login Screen
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
            this.renderFindPeopleList();
        }
    }

    renderSampleRecords() {
        const container = document.getElementById('recent-records-container');
        if (!container) return;

        container.innerHTML = this.samplePersons.map(person => `
            <div class="person-card">
                <div class="person-avatar-placeholder">
                    ${person.name.charAt(0)}
                </div>
                <div class="person-details">
                    <h4 class="person-name">${person.name}</h4>
                    <p class="person-origin">📍 ${person.city}, ${person.district}, ${person.state}</p>
                    <p class="person-context">"${person.context}"</p>
                    <div class="person-tags">
                        ${person.categories.map(c => `<span class="category-tag">${c}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFindPeopleList() {
        const listContainer = document.getElementById('search-results-list');
        if (!listContainer) return;

        listContainer.innerHTML = this.samplePersons.map(person => `
            <div class="search-result-item">
                <div class="result-header">
                    <strong>${person.name}</strong>
                    <span class="result-location">${person.city}, ${person.state}</span>
                </div>
                <p class="result-meta">${person.context}</p>
            </div>
        `).join('');
    }
}

// Auto-instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.janMitraApp = new JanMitraApp();
});
