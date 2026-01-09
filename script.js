let levelsData = [];
let filteredLevels = [];
let currentPage = 1;
const itemsPerPage = 12;

// Load JSON data
async function loadLevelsData() {
    try {
        const response = await fetch('levels.json', { cache: 'no-store' });
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
    
    // Sort copies so approved ones appear first
    const sortedCopies = [...level.copies].sort((a, b) => {
        if (a.status === 'approved' && b.status !== 'approved') return -1;
        if (a.status !== 'approved' && b.status === 'approved') return 1;
        return 0; // Keep original order for non-approved copies
    });
    
    const copiesList = sortedCopies.map(copy => {
        const statusClass = `copy-status-${copy.status}`;
        const statusIcon = copy.status === 'approved' ? '✓' : copy.status === 'pending' ? '⏳' : '✗';
        const copyName = copy.name ? escapeHtml(copy.name) : 'Unnamed Copy';
        const hasReason = copy.reason && copy.reason.trim();
        const tooltipAttr = hasReason ? `data-tooltip="${escapeHtmlAttr(copy.reason)}"` : '';
        const tooltipClass = hasReason ? 'has-tooltip' : '';
        const tags = copy.tags || [];
        const tagsHtml = tags.length > 0 ? `
            <div class="copy-tags">
                ${tags.map(tag => `<span class="copy-tag copy-tag-${tag.toLowerCase()}">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : '';
        
        return `
            <div class="copy-item ${tooltipClass}" ${tooltipAttr} data-copy-id="${escapeHtmlAttr(copy.id.toString())}">
                <div class="copy-info">
                    <div class="copy-name">${copyName}</div>
                    <div class="copy-meta">
                        <span class="copy-id">ID: ${escapeHtml(copy.id.toString())}</span>
                        <span class="copy-creator">by ${escapeHtml(copy.creator)}</span>
                    </div>
                    ${tagsHtml}
                </div>
                <span class="copy-status ${statusClass}">
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
                    ${copiesList || '<div class="no-copies-message">No copies found for this level</div>'}
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

// Escape HTML for use in attributes (handles quotes)
function escapeHtmlAttr(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;');
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
    
    // Compact layout for all screen sizes: [⏮] [←] [1] [Current] [Last] [→] [⏭]
    // First page button
    paginationHTML += `
        <button class="page-btn page-nav-btn" id="firstBtn" ${currentPage === 1 ? 'disabled' : ''} aria-label="First page">
            ⏮
        </button>
    `;
    
    // Previous button
    paginationHTML += `
        <button class="page-btn page-nav-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
            ←
        </button>
    `;
    
    // Show first page if not current
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn page-number" data-page="1">1</button>`;
        if (currentPage > 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Show current page
    paginationHTML += `
        <button class="page-btn page-number active" data-page="${currentPage}">
            ${currentPage}
        </button>
    `;
    
    // Show last page if not current
    if (currentPage < totalPages) {
        if (currentPage < totalPages - 1) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="page-btn page-number" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn page-nav-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
            →
        </button>
    `;
    
    // Last page button
    paginationHTML += `
        <button class="page-btn page-nav-btn" id="lastBtn" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Last page">
            ⏭
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Add event listeners
    document.getElementById('firstBtn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            displayLevels(filteredLevels);
            updateResultsCount(filteredLevels.length);
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
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
    
    document.getElementById('lastBtn')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
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

// Copy ID to clipboard and show notification
function copyIdToClipboard(id) {
    navigator.clipboard.writeText(id).then(() => {
        showNotification(`Copied ID: ${id}`);
    }).catch(err => {
        console.error('Failed to copy ID:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = id;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification(`Copied ID: ${id}`);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    });
}

// Show notification toast
function showNotification(message) {
    // Remove existing notification if any
    const existingNotification = document.getElementById('copyNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'copyNotification';
    notification.className = 'copy-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
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
    
    // Update pagination on window resize to adapt to screen size changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updatePagination();
        }, 150);
    });
    
    // Initial check after page loads
    setTimeout(() => handleScroll(), 300);
    
    // Handle copy item clicks (copy ID to clipboard)
    document.addEventListener('click', (e) => {
        const copyItem = e.target.closest('.copy-item');
        if (copyItem) {
            const copyId = copyItem.getAttribute('data-copy-id');
            if (copyId) {
                // Check if we're clicking on a tooltip element on mobile
                const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                const hasTooltip = copyItem.classList.contains('has-tooltip');
                
                if (hasTooltip && isTouchDevice) {
                    // On mobile with tooltip, check if tooltip is active
                    const isTooltipActive = copyItem.classList.contains('tooltip-active');
                    if (!isTooltipActive) {
                        // First click: show tooltip
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Close all other tooltips
                        document.querySelectorAll('.copy-item.has-tooltip').forEach(el => {
                            el.classList.remove('tooltip-active');
                        });
                        
                        // Toggle current tooltip
                        copyItem.classList.add('tooltip-active');
                        return;
                    }
                    // If tooltip is already active, proceed to copy
                }
                
                // Copy ID to clipboard
                copyIdToClipboard(copyId);
                
                // Close tooltip if it was open
                if (hasTooltip) {
                    copyItem.classList.remove('tooltip-active');
                }
            }
        } else {
            // Close all tooltips when clicking elsewhere
            document.querySelectorAll('.copy-item.has-tooltip').forEach(el => {
                el.classList.remove('tooltip-active');
            });
        }
    });
});
