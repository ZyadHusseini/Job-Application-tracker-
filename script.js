// Job Application Tracker JavaScript

class JobApplicationTracker {
    constructor() {
        this.applications = this.loadApplications();
        this.currentEditingId = null;
        this.initializeEventListeners();
        this.updateStats();
        this.renderApplications();
    }

    initializeEventListeners() {
        // Modal controls
        document.getElementById('addApplicationBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('applicationForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => this.filterApplications());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterApplications());
        
        // Close modal on outside click
        document.getElementById('applicationModal').addEventListener('click', (e) => {
            if (e.target.id === 'applicationModal') {
                this.closeModal();
            }
        });
    }

    loadApplications() {
        const saved = localStorage.getItem('jobApplications');
        return saved ? JSON.parse(saved) : [];
    }

    saveApplications() {
        localStorage.setItem('jobApplications', JSON.stringify(this.applications));
    }

    openModal(application = null) {
        const modal = document.getElementById('applicationModal');
        const form = document.getElementById('applicationForm');
        const modalTitle = document.getElementById('modalTitle');
        
        if (application) {
            // Editing existing application
            this.currentEditingId = application.id;
            modalTitle.textContent = 'Edit Application';
            this.populateForm(application);
        } else {
            // Adding new application
            this.currentEditingId = null;
            modalTitle.textContent = 'Add Application';
            form.reset();
            document.getElementById('applicationDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('applicationModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    populateForm(application) {
        document.getElementById('companyName').value = application.companyName;
        document.getElementById('jobTitle').value = application.jobTitle;
        document.getElementById('jobUrl').value = application.jobUrl || '';
        document.getElementById('applicationDate').value = application.applicationDate;
        document.getElementById('status').value = application.status;
        document.getElementById('notes').value = application.notes || '';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            jobUrl: document.getElementById('jobUrl').value.trim(),
            applicationDate: document.getElementById('applicationDate').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value.trim()
        };

        if (this.currentEditingId) {
            // Update existing application
            const index = this.applications.findIndex(app => app.id === this.currentEditingId);
            if (index !== -1) {
                this.applications[index] = { ...this.applications[index], ...formData };
            }
        } else {
            // Add new application
            const newApplication = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.applications.unshift(newApplication);
        }

        this.saveApplications();
        this.updateStats();
        this.renderApplications();
        this.closeModal();
    }

    deleteApplication(id) {
        if (confirm('Are you sure you want to delete this application?')) {
            this.applications = this.applications.filter(app => app.id !== id);
            this.saveApplications();
            this.updateStats();
            this.renderApplications();
        }
    }

    editApplication(id) {
        const application = this.applications.find(app => app.id === id);
        if (application) {
            this.openModal(application);
        }
    }

    renderApplications() {
        const grid = document.getElementById('applicationsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.applications.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        const filteredApplications = this.getFilteredApplications();
        
        grid.innerHTML = filteredApplications.map(application => this.createApplicationCard(application)).join('');
    }

    createApplicationCard(application) {
        const daysAgo = this.getDaysAgo(application.applicationDate);
        const statusClass = application.status.toLowerCase().replace(' ', '-');
        
        return `
            <div class="application-card status-${statusClass}">
                <div class="card-header">
                    <div>
                        <div class="company-name">${this.escapeHtml(application.companyName)}</div>
                        <div class="job-title">${this.escapeHtml(application.jobTitle)}</div>
                    </div>
                    <span class="status-badge status-${statusClass}">${application.status}</span>
                </div>
                <div class="card-body">
                    <div class="application-date">
                        <i class="fas fa-calendar"></i>
                        Applied ${daysAgo} ago
                    </div>
                    ${application.jobUrl ? `
                        <a href="${this.escapeHtml(application.jobUrl)}" target="_blank" class="job-url">
                            <i class="fas fa-external-link-alt"></i>
                            View Job Posting
                        </a>
                    ` : ''}
                    ${application.notes ? `
                        <div class="notes">${this.escapeHtml(application.notes)}</div>
                    ` : ''}
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="app.editApplication('${application.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteApplication('${application.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredApplications() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        
        return this.applications.filter(application => {
            const matchesSearch = !searchTerm || 
                application.companyName.toLowerCase().includes(searchTerm) ||
                application.jobTitle.toLowerCase().includes(searchTerm) ||
                (application.notes && application.notes.toLowerCase().includes(searchTerm));
            
            const matchesStatus = !statusFilter || application.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }
    filterApplications() {
        this.renderApplications();
    }

    updateStats() {
        const total = this.applications.length;
        const active = this.applications.filter(app => 
            ['Applied', 'Interview'].includes(app.status)
        ).length;
        const interviews = this.applications.filter(app => 
            app.status === 'Interview'
        ).length;

        document.getElementById('totalApplications').textContent = total;
        document.getElementById('activeApplications').textContent = active;
        document.getElementById('interviews').textContent = interviews;  
    }

    getDaysAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return '1 day';
        return `${diffDays} days`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JobApplicationTracker();
});

// Add some sample data for demonstration (remove in production)
if (localStorage.getItem('jobApplications') === null) {
    const sampleData = [
        {
            id: '1',
            companyName: 'KEDGE SCHOOL',
            jobTitle: 'Senior Software Engineer',
            jobUrl: 'https://example.com/job1',
            applicationDate: '2024-01-15',
            status: 'Interview',
            notes: 'Phone interview scheduled for next week. Very excited about this opportunity!',
            createdAt: '2024-01-15T10:00:00.000Z'
        },
        {
            id: '2',
            companyName: 'HEC SCHOOL',
            jobTitle: 'Full Stack Developer',
            jobUrl: 'https://example.com/job2',
            applicationDate: '2024-01-10',
            status: 'Applied',
            notes: 'Applied through LinkedIn. Company seems to have great culture.',
            createdAt: '2024-01-10T14:30:00.000Z'
        },
        {
            id: '3',
            companyName: 'HARVARD',
            jobTitle: 'Frontend Developer',
            jobUrl: '',
            applicationDate: '2024-01-05',
            status: 'Rejected',
            notes: 'They were looking for someone with more React experience.',
            createdAt: '2024-01-05T09:15:00.000Z'
        }
    ];
    localStorage.setItem('jobApplications', JSON.stringify(sampleData));
}