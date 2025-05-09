    const pokemonContainer = document.getElementById('pokemonContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    const modalBackdrop = document.getElementById('modalBackdrop');
    const modal = document.getElementById('modal');
    const modalLeft = document.getElementById('modalLeft');
    const modalRight = document.getElementById('modalRight');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    const limit = 20;
    let offset = 0;
    let totalPokemons = 1118; // As of now, PokeAPI has 1118 pokemons

    // Utility: Capitalize first letter
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Map type to color for badges
    const typeColors = {
      normal: 'bg-gray-400',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-400',
      grass: 'bg-green-500',
      ice: 'bg-cyan-300',
      fighting: 'bg-red-700',
      poison: 'bg-purple-600',
      ground: 'bg-yellow-700',
      flying: 'bg-indigo-300',
      psychic: 'bg-pink-500',
      bug: 'bg-green-700',
      rock: 'bg-gray-600',
      ghost: 'bg-indigo-700',
      dragon: 'bg-purple-800',
      dark: 'bg-gray-800',
      steel: 'bg-gray-500',
      fairy: 'bg-pink-300',
    };

    // Fetch list of pokemons with offset and limit
    async function fetchPokemonList(offset, limit) {
      const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch Pokémon list');
      const data = await res.json();
      return data;
    }

    // Fetch detailed pokemon data by name or id
    async function fetchPokemonData(nameOrId) {
      const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId.toString().toLowerCase()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Pokémon not found');
      const data = await res.json();
      return data;
    }

    // Create a collapsed pokemon card element (image, name + element)
    function createCollapsedCard(pokemon) {
      const name = capitalize(pokemon.name);
      const types = pokemon.types.map(t => {
        const typeName = t.type.name;
        const colorClass = typeColors[typeName] || 'bg-gray-400';
        return `<span class="text-white text-xs font-semibold mr-1 px-2 py-1 rounded ${colorClass}">${capitalize(typeName)}</span>`;
      }).join('');

      const sprite =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        'https://placehold.co/96x96?text=No+Image';

      return `
        <article tabindex="0" role="button" aria-label="View details for ${name}" class="cursor-pointer select-none p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-red-600">
          <div class="w-24 h-24 mb-3">
            <img
              src="${sprite}"
              alt="Official artwork of Pokémon ${name}, a ${pokemon.types.map(t => t.type.name).join(', ')} type"
              class="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <h2 class="text-lg font-bold mb-2">${name}</h2>
          <div>${types}</div>
        </article>
      `;
    }

    // Create modal content for detailed pokemon info
    function createModalContent(pokemon) {
      const name = capitalize(pokemon.name);
      const types = pokemon.types.map(t => {
        const typeName = t.type.name;
        const colorClass = typeColors[typeName] || 'bg-gray-400';
        return `<span class="text-white text-xs font-semibold mr-1 px-2 py-1 rounded ${colorClass}">${capitalize(typeName)}</span>`;
      }).join('');

      // Stats list
      const stats = pokemon.stats.map(stat => {
        const statName = stat.stat.name.replace('special-', 'Sp. ');
        const baseStat = stat.base_stat;
        return `
          <div class="flex justify-between text-sm font-mono mb-1">
            <span class="capitalize">${statName}</span>
            <span>${baseStat}</span>
          </div>
        `;
      }).join('');

      // Abilities list
      const abilities = pokemon.abilities.map(a => capitalize(a.ability.name)).join(', ');

      // Moves list (show up to 6 moves)
      const moves = pokemon.moves.slice(0, 6).map(m => capitalize(m.move.name)).join(', ');

      // Official artwork image
      const sprite =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default ||
        'https://placehold.co/300x300?text=No+Image';

      // Left side: image
      const leftHtml = `
        <img
          src="${sprite}"
          alt="Official artwork of Pokémon ${name}, a ${pokemon.types.map(t => t.type.name).join(', ')} type"
          class="w-full h-auto object-contain rounded-lg"
          loading="lazy"
        />
      `;

      // Right side: details
      const rightHtml = `
        <h2 id="modalTitle" class="text-3xl font-bold mb-3">${name}</h2>
        <div class="mb-4 flex flex-wrap gap-1">${types}</div>
        <section aria-labelledby="statsTitle" class="mb-4">
          <h3 id="statsTitle" class="font-semibold text-red-600 mb-2 text-lg">Stats</h3>
          ${stats}
        </section>
        <section aria-labelledby="abilitiesTitle" class="mb-4">
          <h3 id="abilitiesTitle" class="font-semibold text-red-600 mb-2 text-lg">Abilities</h3>
          <p class="text-sm">${abilities}</p>
        </section>
        <section aria-labelledby="movesTitle" class="mb-4">
          <h3 id="movesTitle" class="font-semibold text-red-600 mb-2 text-lg">Moves (up to 6)</h3>
          <p class="text-sm">${moves || 'None'}</p>
        </section>
      `;

      return { leftHtml, rightHtml };
    }

    // Render a list of pokemons in collapsed form
    async function renderPokemonList(offset, limit) {
      pokemonContainer.innerHTML = `<p class="text-center col-span-full text-gray-600">Loading...</p>`;
      try {
        const data = await fetchPokemonList(offset, limit);
        const promises = data.results.map(p => fetchPokemonData(p.name));
        const pokemons = await Promise.all(promises);
        pokemonContainer.innerHTML = pokemons.map(p => createCollapsedCard(p)).join('');
        updateButtons();
        attachCardListeners(pokemons);
      } catch (error) {
        pokemonContainer.innerHTML = `<p class="text-center col-span-full text-red-600 font-semibold">${error.message}</p>`;
      }
    }

    // Render a single pokemon by name or id (search) in collapsed form (like list)
    async function renderSinglePokemon(nameOrId) {
      pokemonContainer.innerHTML = `<p class="text-center col-span-full text-gray-600">Loading...</p>`;
      try {
        const pokemon = await fetchPokemonData(nameOrId);
        pokemonContainer.innerHTML = createCollapsedCard(pokemon);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        attachCardListeners([pokemon]);
      } catch (error) {
        pokemonContainer.innerHTML = `<p class="text-center col-span-full text-red-600 font-semibold">${error.message}</p>`;
      }
    }

    // Update pagination buttons state
    function updateButtons() {
      prevBtn.disabled = offset <= 0;
      nextBtn.disabled = offset + limit >= totalPokemons;
    }

    // Attach click and keyboard listeners to cards to open modal
    function attachCardListeners(pokemons) {
      const cards = Array.from(pokemonContainer.children);
      cards.forEach((card, i) => {
        card.addEventListener('click', () => openModal(pokemons[i]));
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(pokemons[i]);
          }
        });
      });
    }

    // Open modal with pokemon details
    function openModal(pokemon) {
      const { leftHtml, rightHtml } = createModalContent(pokemon);
      modalLeft.innerHTML = leftHtml;
      modalRight.innerHTML = rightHtml;

      modalBackdrop.classList.remove('hidden');
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';

      // Focus modal container for accessibility
      modal.querySelector('div[tabindex="0"]').focus();

      // Trap focus inside modal
      trapFocus(modal);

      // Close modal on backdrop click
      modalBackdrop.onclick = closeModal;

      // Close modal on Escape key
      document.addEventListener('keydown', escKeyListener);

      // Close button listener
      modalCloseBtn.onclick = closeModal;
    }

    // Close modal
    function closeModal() {
      modalBackdrop.classList.add('hidden');
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      modalLeft.innerHTML = '';
      modalRight.innerHTML = '';
      document.removeEventListener('keydown', escKeyListener);
      modalBackdrop.onclick = null;
      modalCloseBtn.onclick = null;
      releaseFocusTrap();
      // Return focus to last focused card
      if (lastFocusedCard) lastFocusedCard.focus();
    }

    // Escape key listener for modal close
    function escKeyListener(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    }

    // Focus trap variables
    let lastFocusedElement = null;
    let lastFocusedCard = null;

    // Trap focus inside modal
    function trapFocus(element) {
      lastFocusedElement = document.activeElement;
      // Save last focused card to return focus after modal closes
      lastFocusedCard = document.activeElement;

      const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
      const focusableElements = element.querySelectorAll(focusableElementsString);
      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      function handleFocus(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }

      element.addEventListener('keydown', handleFocus);
      element._handleFocus = handleFocus;

      // Focus first focusable element
      firstFocusable.focus();
    }

    // Release focus trap
    function releaseFocusTrap() {
      if (!modal._handleFocus) return;
      modal.removeEventListener('keydown', modal._handleFocus);
      modal._handleFocus = null;
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
      if (offset >= limit) {
        offset -= limit;
        renderPokemonList(offset, limit);
      }
    });

    nextBtn.addEventListener('click', () => {
      if (offset + limit < totalPokemons) {
        offset += limit;
        renderPokemonList(offset, limit);
      }
    });

    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim().toLowerCase();
      
      if (!query) {
        // If the input is empty, reload the paginated list with the selected generation
        renderFilteredPokemonList(selectedGeneration);
        return;
      }
    
      try {
        // Fetch all Pokémon based on the selected generation and filter by search query
        pokemonContainer.innerHTML = `<p class="text-center col-span-full text-gray-600">Loading...</p>`;
        const data = await fetchPokemonByGeneration(selectedGeneration); // Fetch Pokémon based on generation
        const filteredPokemons = data.results.filter((pokemon) =>
          pokemon.name.includes(query)
        );
    
        if (filteredPokemons.length === 0) {
          pokemonContainer.innerHTML = `<p class="text-center col-span-full text-red-600 font-semibold">No Pokémon found for "${query}".</p>`;
          return;
        }
    
        const promises = filteredPokemons.map((p) => fetchPokemonData(p.name));
        const pokemons = await Promise.all(promises);
    
        pokemonContainer.innerHTML = pokemons.map((p) => createCollapsedCard(p)).join('');
        attachCardListeners(pokemons); // Reattach event listeners to filtered Pokémon
      } catch (error) {
        pokemonContainer.innerHTML = `<p class="text-center col-span-full text-red-600 font-semibold">${error.message}</p>`;
      }
    });
    
    
    async function fetchPokemonByGeneration(generation) {
      if (generation === 'all') {
        return fetchPokemonList(0, totalPokemons);
      }
    
      const generationUrlMap = {
        'generation-i': 'https://pokeapi.co/api/v2/generation/1/',
        'generation-ii': 'https://pokeapi.co/api/v2/generation/2/',
        'generation-iii': 'https://pokeapi.co/api/v2/generation/3/',
        'generation-iv': 'https://pokeapi.co/api/v2/generation/4/',
        'generation-v': 'https://pokeapi.co/api/v2/generation/5/',
        'generation-vi': 'https://pokeapi.co/api/v2/generation/6/',
        'generation-vii': 'https://pokeapi.co/api/v2/generation/7/',
        'generation-viii': 'https://pokeapi.co/api/v2/generation/8/',
      };
    
      const url = generationUrlMap[generation];
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch generation data');
    
      const data = await res.json();
    
      // Map `pokemon_species` to names and IDs (fetchable via `/pokemon`)
      const fetchablePokemon = data.pokemon_species.map((species) => {
        const id = species.url.split('/').filter(Boolean).pop(); // Extract ID from URL
        return { name: species.name, id };
      });
    
      return { results: fetchablePokemon };
    }
    

    let selectedGeneration = 'all'; // Default to 'all' which means no generation filter
  
    const generationFilter = document.getElementById('generationFilter');

// Event listener for generation filter change
generationFilter.addEventListener('change', async (e) => {
  selectedGeneration = e.target.value;
  offset = 0; // Reset pagination to the first page
  renderFilteredPokemonList(selectedGeneration);
});


async function renderFilteredPokemonList(generation) {
  pokemonContainer.innerHTML = `<p class="text-center col-span-full text-gray-600">Loading...</p>`;
  try {
    const data = await fetchPokemonByGeneration(generation);

    // Fetch Pokémon data using IDs or names
    const promises = data.results.map(async (p) => {
      try {
        return await fetchPokemonData(p.name); // Name-based fetch
      } catch (e) {
        console.error(`Failed to fetch Pokémon: ${p.name}`, e);
        return null; // Gracefully handle fetch errors
      }
    });

    const pokemons = (await Promise.all(promises)).filter(Boolean); // Filter out null responses

    // Render Pokémon cards
    pokemonContainer.innerHTML = pokemons.map((p) => createCollapsedCard(p)).join('');
    updateButtons();
    attachCardListeners(pokemons);
  } catch (error) {
    pokemonContainer.innerHTML = `<p class="text-center col-span-full text-red-600 font-semibold">${error.message}</p>`;
  }
}




    // Initial load
    renderPokemonList(offset, limit);

