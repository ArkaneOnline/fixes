let levelsData = [];
let filteredLevels = [];
let currentPage = 1;
const itemsPerPage = 12;

// Load JSON data
async function loadLevelsData() {
    try {
        const response = await fetch('levels.json');
        if (!response.ok) {
            throw new Error('Failed to load levels data');
        }
        levelsData = await response.json();
        filteredLevels = levelsData;
        currentPage = 1;
        displayLevels(filteredLevels);
        updateResultsCount(filteredLevels.length);
        updatePagination();
        // Check scroll position after rendering
        setTimeout(() => handleScroll(), 200);
    } catch (error) {
        console.error('Error loading levels data:', error);
        document.getElementById('levelsContainer').innerHTML = 
            '<div class="no-results"><p>Error loading levels data. Please check that levels.json exists and is valid.</p></div>';
    }
}

// Display levels in the container
function displayLevels(levels) {
    const container = document.getElementById('levelsContainer');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    
    if (levels.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    noResults.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(levels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLevels = levels.slice(startIndex, endIndex);
    
    container.innerHTML = paginatedLevels.map(level => createLevelCard(level)).join('');
    
    // Show/hide pagination
    if (totalPages > 1) {
        pagination.style.display = 'flex';
    } else {
        pagination.style.display = 'none';
    }
}

// Create HTML for a level card
function createLevelCard(level) {
    const approvedCount = level.copies.filter(c => c.status === 'approved').length;
    const pendingCount = level.copies.filter(c => c.status === 'pending').length;
    const rejectedCount = level.copies.filter(c => c.status === 'rejected').length;
    const totalCopies = level.copies.length;
    
    const copiesList = level.copies.map(copy => {
        const statusClass = `copy-status-${copy.status}`;
        const statusIcon = copy.status === 'approved' ? '✓' : copy.status === 'pending' ? '⏳' : '✗';
        const copyName = copy.name ? escapeHtml(copy.name) : 'Unnamed Copy';
        const hasReason = copy.reason && copy.reason.trim();
        const tooltipAttr = hasReason ? `data-tooltip="${escapeHtml(copy.reason)}"` : '';
        
        return `
            <div class="copy-item">
                <div class="copy-info">
                    <div class="copy-name">${copyName}</div>
                    <div class="copy-meta">
                        <span class="copy-id">ID: ${escapeHtml(copy.id.toString())}</span>
                        <span class="copy-creator">by ${escapeHtml(copy.creator)}</span>
                    </div>
                </div>
                <span class="copy-status ${statusClass} ${hasReason ? 'has-tooltip' : ''}" ${tooltipAttr}>
                    <span class="status-icon">${statusIcon}</span>
                    <span class="status-text">${copy.status}</span>
                </span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="level-card">
            <div class="level-header">
                <div class="level-name">${escapeHtml(level.name)}</div>
                <div class="level-id">Original ID: ${escapeHtml(level.id.toString())}</div>
            </div>
            <div class="level-creator">
                <strong>Original Creator:</strong> ${escapeHtml(level.creator)}
            </div>
            ${level.description ? `<div class="level-description">${escapeHtml(level.description)}</div>` : ''}
            <div class="copies-summary">
                <span class="summary-item approved">${approvedCount} Approved</span>
                <span class="summary-item pending">${pendingCount} Pending</span>
                <span class="summary-item rejected">${rejectedCount} Rejected</span>
                <span class="summary-item total">${totalCopies} Total</span>
            </div>
            <div class="copies-section">
                <div class="copies-header">Copies:</div>
                <div class="copies-list">
                    ${copiesList}
                </div>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search functionality
function searchLevels(query) {
    if (!query.trim()) {
        filteredLevels = levelsData;
    } else {
        const lowerQuery = query.toLowerCase();
        filteredLevels = levelsData.filter(level => {
            // Search in level name, creator, description, and copy creators
            const matchesLevel = (
                level.name.toLowerCase().includes(lowerQuery) ||
                level.creator.toLowerCase().includes(lowerQuery) ||
                level.id.toString().includes(lowerQuery) ||
                (level.description && level.description.toLowerCase().includes(lowerQuery))
            );
            
            // Also search in copies
            const matchesCopies = level.copies.some(copy => 
                copy.creator.toLowerCase().includes(lowerQuery) ||
                copy.id.toString().includes(lowerQuery) ||
                copy.status.toLowerCase().includes(lowerQuery) ||
                (copy.name && copy.name.toLowerCase().includes(lowerQuery))
            );
            
            return matchesLevel || matchesCopies;
        });
    }
    
    // Reset to first page when searching
    currentPage = 1;
    displayLevels(filteredLevels);
    updateResultsCount(filteredLevels.length);
    updatePagination();
}

// Update results count
function updateResultsCount(count) {
    const resultsInfo = document.getElementById('resultsCount');
    const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
    
    if (count === 0) {
        resultsInfo.textContent = '0';
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, count);
    
    if (totalPages > 1) {
        resultsInfo.innerHTML = `${startIndex}-${endIndex} of ${count}`;
    } else {
        resultsInfo.textContent = count;
    }
}

// Update pagination controls
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.classList.remove('visible');
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    // Use setTimeout to ensure display is set before adding visible class
    setTimeout(() => {
        pagination.classList.add('visible');
    }, 10);
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
        paginationHTML += `<button class="page-btn page-number" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    // Last page and ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="page-btn page-number" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Add event listeners
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayLevels(filteredLevels);
            updateResultsCount(filteredLevels.length);
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayLevels(filteredLevels);
            updateResultsCount(filteredLevels.length);
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Add event listeners to page number buttons
    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page !== currentPage) {
                currentPage = page;
                displayLevels(filteredLevels);
                updateResultsCount(filteredLevels.length);
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// Scroll detection for pagination animation
let scrollTimeout;

function handleScroll() {
    const pagination = document.getElementById('pagination');
    if (!pagination || pagination.style.display === 'none' || !pagination.classList.contains('visible')) return;
    
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollBottom = scrollTop + windowHeight;
    
    // Check if we're at or near the bottom (within 50px)
    const isAtBottom = scrollBottom >= documentHeight - 50;
    
    // Add bounce animation when reaching the bottom
    if (isAtBottom && scrollBottom >= documentHeight - 10) {
        pagination.style.transform = 'translateX(-50%) translateY(0) scale(1.05)';
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            pagination.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        }, 300);
    } else {
        pagination.style.transform = 'translateX(-50%) translateY(0)';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearButton');
    
    // Load data on page load
    loadLevelsData();
    
    // Search as user types
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        searchLevels(query);
        
        // Show/hide clear button
        if (query.trim()) {
            clearButton.style.display = 'block';
        } else {
            clearButton.style.display = 'none';
        }
    });
    
    // Clear search
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        searchLevels('');
    });
    
    // Allow Escape key to clear search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            clearButton.style.display = 'none';
            searchLevels('');
        }
    });
    
    // Throttle scroll events for better performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Initial check after page loads
    setTimeout(() => handleScroll(), 300);
});
