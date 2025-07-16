// script.js
const API_BASE = 'https://merdometrodolul4.onrender.com';
// 1) Seletor de elementos
const form      = document.getElementById('link-form');
const input     = document.getElementById('input_url');
const counterEl = document.getElementById('counter');
const timeline  = document.getElementById('timeline');

let count = 0;

// 2) Função para renderizar um item na timeline (idempotente)
function addTimelineItem({ id, url, title, createdAt }) {
  // Formata data
  const date = new Date(createdAt.seconds * 1000).toLocaleString();

  const li = document.createElement('li');
  li.id = id;
  li.innerHTML = `
    <div class="header">${title || url}</div>
    <div class="content">
      <p><em>Adicionado em: ${date}</em></p>
      <p><a href="${url}" target="_blank" rel="noopener">${url}</a></p>
    </div>
  `;
  timeline.appendChild(li);
}

// 3) Carrega os últimos links ao iniciar a página
async function loadLinks() {
  try {
    const resp = await fetch(`${API_BASE}/links?limit=20`);
    const links = await resp.json();

    // reseta timeline e contador
    timeline.innerHTML = '';
    count = links.length;
    counterEl.textContent = count;

    // Renderiza em ordem cronológica (mais antigo primeiro)
    links.reverse().forEach(addTimelineItem);
  } catch (err) {
    console.error('Erro ao carregar links:', err);
  }
}

// 4) Accordion (idem a antes)
timeline.addEventListener('click', e => {
  if (e.target.tagName === 'A') return;
  if (!e.target.classList.contains('header')) return;

  const li      = e.target.parentElement;
  const content = li.querySelector('.content');
  li.classList.toggle('active');
  content.style.maxHeight = li.classList.contains('active')
    ? content.scrollHeight + 'px'
    : '0';
});

// 5) Submit: chama a API e, se OK, preenche timeline + contador
form.addEventListener('submit', async e => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  try {
    const resp = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Erro desconhecido');

    // adiciona só o novo item
    addTimelineItem(data);
    count++;
    counterEl.textContent = count;
    input.value = '';

    // rola a placa de volta ao topo
    document.querySelector('.image_counter')
            .scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    alert(err.message);
  }
});

// 6) Chama o loadLinks() assim que o script carregar
loadLinks();
