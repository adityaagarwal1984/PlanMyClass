document.addEventListener('DOMContentLoaded', () => {
  function showNotify(message, type = 'info') {
    const container = document.getElementById('notify-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `notify ${type}`;
    el.textContent = message;
    container.appendChild(el);
    // force reflow then show
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    }, 3000);
  }

  async function doDelete(url, onSuccessMsg, removeDomEl) {
    try {
      const res = await fetch(url, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
      const body = await res.json();
      if (res.ok && body && body.success) {
        showNotify(onSuccessMsg || body.message || 'Deleted', 'success');
        if (typeof removeDomEl === 'function') removeDomEl();
        return true;
      } else {
        showNotify((body && body.message) || 'Delete failed', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      showNotify('Network error', 'error');
      return false;
    }
  }

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (btn) {
      const id = btn.getAttribute('data-id');
      const type = btn.getAttribute('data-type');
      if (!id || !type) return;
      let url = '';
      if (type === 'faculty') url = `/admin/faculty/${id}`;
      else if (type === 'subject') url = `/admin/subjects/${id}`;
      else if (type === 'section') url = `/admin/sections/${id}`;
      else if (type === 'assignment') url = `/admin/assignment/${id}`;
      else if (type === 'timetable') url = `/admin/timetable/${id}`;
      else return;

      const row = btn.closest('tr') || btn.closest('li');
      doDelete(url, 'Deleted', () => {
        if (row) {
          row.remove();
        } else {
          // fallback: reload
          location.reload();
        }
      });
    }

    const clearBtn = e.target.closest('.clear-timetable-btn');
    if (clearBtn) {
      const id = clearBtn.getAttribute('data-id');
      if (!id) return;
      const url = `/admin/timetable/section/${id}`;
      doDelete(url, 'Timetable cleared', () => location.reload());
    }
  });
});
