/**
 * TechWriterReview - Role Dictionary Tab Fix
 * v3.0.55 - Fixes Bug: Dictionary tab shows empty
 * 
 * ROOT CAUSE: In app.js line 6977, the event listener is attached to:
 *   document.querySelectorAll('.roles-tab[data-tab="dictionary"]')
 * But the HTML uses:
 *   <button class="roles-nav-item" data-tab="dictionary">
 * 
 * The selector doesn't match (.roles-tab vs .roles-nav-item), so clicking
 * "Role Dictionary" in the sidebar never triggers loadRoleDictionary().
 * 
 * FIX: Add correct event listener using capturing phase (runs before any
 * existing handlers, doesn't conflict with them).
 */

(function() {
    'use strict';
    
    console.log('[TWR] Role Dictionary fix loading...');
    
    // State for dictionary data (matches app.js DictState structure)
    const DictState = {
        roles: [],
        filteredRoles: [],
        loaded: false
    };
    
    /**
     * Load dictionary data from API
     */
    async function loadDictionary() {
        if (DictState.loaded && DictState.roles.length > 0) {
            // Already loaded, just re-render
            renderDictionary();
            return;
        }
        
        try {
            const response = await fetch('/api/roles/dictionary?include_inactive=true');
            const result = await response.json();
            
            if (result.success) {
                DictState.roles = result.data.roles || [];
                DictState.filteredRoles = [...DictState.roles];
                DictState.loaded = true;
                renderDictionary();
                updateDictStats();
                console.log('[TWR] Dictionary loaded:', DictState.roles.length, 'roles');
            } else {
                console.error('[TWR] Failed to load dictionary:', result.error);
                showDictError('Failed to load dictionary: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('[TWR] Error loading dictionary:', error);
            showDictError('Error loading dictionary: ' + error.message);
        }
    }
    
    /**
     * Render dictionary table
     */
    function renderDictionary() {
        const tbody = document.getElementById('dictionary-body');
        const emptyEl = document.getElementById('dict-empty');
        
        if (!tbody) {
            console.warn('[TWR] Dictionary table body not found');
            return;
        }
        
        // Apply filters
        const searchTerm = (document.getElementById('dict-search')?.value || '').toLowerCase();
        const sourceFilter = document.getElementById('dict-filter-source')?.value || '';
        const categoryFilter = document.getElementById('dict-filter-category')?.value || '';
        
        DictState.filteredRoles = DictState.roles.filter(role => {
            if (searchTerm) {
                const searchFields = [
                    role.role_name,
                    role.category,
                    role.description,
                    ...(role.aliases || [])
                ].filter(Boolean).join(' ').toLowerCase();
                if (!searchFields.includes(searchTerm)) return false;
            }
            if (sourceFilter && role.source !== sourceFilter) return false;
            if (categoryFilter && role.category !== categoryFilter) return false;
            return true;
        });
        
        if (DictState.filteredRoles.length === 0) {
            tbody.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'flex';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        const escapeHtml = (str) => {
            if (str == null) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        };
        
        tbody.innerHTML = DictState.filteredRoles.map(role => {
            const aliases = (role.aliases || []).join(', ') || '-';
            const updatedAt = role.updated_at || role.created_at;
            const dateStr = updatedAt ? new Date(updatedAt).toLocaleDateString() : '-';
            const statusClass = role.is_active ? 'status-active' : 'status-inactive';
            const statusText = role.is_active ? 'Active' : 'Inactive';
            
            return `<tr data-role-id="${role.id}">
                <td>
                    <strong>${escapeHtml(role.role_name)}</strong>
                    ${aliases !== '-' ? `<div class="text-muted text-xs">Aliases: ${escapeHtml(aliases)}</div>` : ''}
                </td>
                <td><span class="category-badge">${escapeHtml(role.category || 'Custom')}</span></td>
                <td><span class="source-badge source-${escapeHtml(role.source || 'manual')}">${escapeHtml(role.source || 'manual')}</span></td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-ghost btn-xs" onclick="TWR.DictFix.editRole(${role.id})" title="Edit">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn btn-ghost btn-xs" onclick="TWR.DictFix.toggleRole(${role.id})" title="${role.is_active ? 'Deactivate' : 'Activate'}">
                        <i data-lucide="${role.is_active ? 'eye-off' : 'eye'}"></i>
                    </button>
                    <button class="btn btn-ghost btn-xs btn-danger" onclick="TWR.DictFix.deleteRole(${role.id})" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        
        // Refresh icons
        if (typeof lucide !== 'undefined') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }
    
    /**
     * Update dictionary stats display
     */
    function updateDictStats() {
        const total = DictState.roles.length;
        const active = DictState.roles.filter(r => r.is_active).length;
        const builtin = DictState.roles.filter(r => r.source === 'builtin').length;
        
        const totalEl = document.getElementById('dict-total');
        const activeEl = document.getElementById('dict-active');
        const builtinEl = document.getElementById('dict-builtin');
        
        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (builtinEl) builtinEl.textContent = builtin;
    }
    
    /**
     * Show error message in dictionary area
     */
    function showDictError(message) {
        const tbody = document.getElementById('dictionary-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-error" style="padding:20px;">
                <i data-lucide="alert-circle"></i> ${message}
            </td></tr>`;
        }
        if (typeof lucide !== 'undefined') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }
    
    /**
     * Edit a role (opens the existing modal if available)
     */
    function editRole(roleId) {
        // Try to use existing app.js function
        if (typeof window.openRoleModal === 'function') {
            window.openRoleModal(roleId);
            return;
        }
        
        // Fallback: find role and populate modal manually
        const role = DictState.roles.find(r => r.id === roleId);
        if (!role) return;
        
        const modal = document.getElementById('edit-role-modal');
        if (!modal) return;
        
        document.getElementById('edit-role-id').value = roleId;
        document.getElementById('edit-role-name').value = role.role_name || '';
        document.getElementById('edit-role-category').value = role.category || 'Custom';
        document.getElementById('edit-role-aliases').value = (role.aliases || []).join(', ');
        document.getElementById('edit-role-description').value = role.description || '';
        document.getElementById('edit-role-title').textContent = 'Edit Role';
        
        modal.style.display = 'flex';
    }
    
    /**
     * Toggle role active status
     */
    async function toggleRole(roleId) {
        const role = DictState.roles.find(r => r.id === roleId);
        if (!role) return;
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const response = await fetch(`/api/roles/dictionary/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: !role.is_active })
            });
            
            const result = await response.json();
            if (result.success) {
                role.is_active = !role.is_active;
                renderDictionary();
                updateDictStats();
                showToast('success', `Role ${role.is_active ? 'activated' : 'deactivated'}`);
            } else {
                showToast('error', 'Failed to update role: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showToast('error', 'Error updating role: ' + error.message);
        }
    }
    
    /**
     * Delete a role
     */
    async function deleteRole(roleId) {
        if (!confirm('Are you sure you want to delete this role? This cannot be undone.')) {
            return;
        }
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
            const response = await fetch(`/api/roles/dictionary/${roleId}?hard=true`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': csrfToken }
            });
            
            const result = await response.json();
            if (result.success) {
                DictState.roles = DictState.roles.filter(r => r.id !== roleId);
                renderDictionary();
                updateDictStats();
                showToast('success', 'Role deleted');
            } else {
                showToast('error', 'Failed to delete role: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            showToast('error', 'Error deleting role: ' + error.message);
        }
    }
    
    /**
     * Show toast notification
     */
    function showToast(type, message) {
        if (typeof window.toast === 'function') {
            window.toast(type, message);
        } else if (window.TWR?.Modals?.toast) {
            window.TWR.Modals.toast(type, message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    /**
     * Initialize fix - attach event listener to correct element
     */
    function init() {
        // Find the dictionary tab button using CORRECT selector
        const dictTab = document.querySelector('.roles-nav-item[data-tab="dictionary"]');
        
        if (dictTab) {
            // Use capturing phase to run before any existing handlers
            dictTab.addEventListener('click', function(e) {
                console.log('[TWR] Dictionary tab clicked - loading data...');
                loadDictionary();
            }, true);
            
            console.log('[TWR] Role Dictionary fix initialized');
        } else {
            console.warn('[TWR] Dictionary tab button not found');
        }
        
        // Also set up filter listeners (in case app.js ones didn't attach)
        document.getElementById('dict-search')?.addEventListener('input', function() {
            if (DictState.loaded) {
                clearTimeout(this._debounce);
                this._debounce = setTimeout(renderDictionary, 300);
            }
        });
        
        document.getElementById('dict-filter-source')?.addEventListener('change', function() {
            if (DictState.loaded) renderDictionary();
        });
        
        document.getElementById('dict-filter-category')?.addEventListener('change', function() {
            if (DictState.loaded) renderDictionary();
        });
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expose functions globally for button onclick handlers
    window.TWR = window.TWR || {};
    window.TWR.DictFix = {
        loadDictionary: loadDictionary,
        renderDictionary: renderDictionary,
        editRole: editRole,
        toggleRole: toggleRole,
        deleteRole: deleteRole
    };
    
})();
