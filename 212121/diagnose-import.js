/**
 * SKRYPT DIAGNOSTYCZNY - Wklej w konsolę przeglądarki (F12)
 * Ten skrypt sprawdzi czy wszystkie funkcje importu są dostępne
 */

console.log('%c🔍 DIAGNOSTYKA FUNKCJI IMPORTU', 'font-size: 20px; font-weight: bold; color: #10b981;');
console.log('═══════════════════════════════════════════════════════════');

// Lista wszystkich wymaganych funkcji
const requiredFunctions = {
    'Generowanie szablonu CSV': 'generateCSVTemplate',
    'Eksport do CSV': 'exportProductsToCSV',
    'Pobieranie pliku CSV': 'downloadCSV',
    'Parsowanie CSV': 'parseCSV',
    'Parsowanie JSON': 'parseJSON',
    'Import z pliku': 'importProductsFromFile',
    'Bulk import': 'bulkImportProducts',
    'Zapis do bazy': 'saveProductToDB',
    'Pobieranie produktów': 'getProducts',
    'Toast (powiadomienia)': 'showToast',
    'Ładowanie admina produktów': 'loadAdminProducts'
};

console.log('\n📦 SPRAWDZANIE FUNKCJI:');
console.log('───────────────────────────────────────────────────────────');

let allOk = true;
const missing = [];

Object.entries(requiredFunctions).forEach(([label, fnName]) => {
    const exists = typeof window[fnName] === 'function';
    const icon = exists ? '✅' : '❌';
    const status = exists ? 'OK' : 'BRAK';
    
    console.log(`${icon} ${label.padEnd(30)} → ${fnName.padEnd(25)} [${status}]`);
    
    if (!exists) {
        allOk = false;
        missing.push(fnName);
    }
});

console.log('───────────────────────────────────────────────────────────');

// Sprawdzenie elementów DOM
console.log('\n🎯 SPRAWDZANIE ELEMENTÓW DOM:');
console.log('───────────────────────────────────────────────────────────');

const requiredElements = {
    'Modal importu': 'import-products-modal',
    'Przycisk pobierz szablon': 'download-template',
    'Input pliku': 'import-file-input',
    'Przycisk wybierz plik': 'select-file-btn',
    'Przycisk start import': 'start-import-btn',
    'Info o pliku': 'file-info',
    'Nazwa pliku': 'file-name',
    'Liczba produktów': 'products-count',
    'Pasek postępu': 'import-progress',
    'Wyniki importu': 'import-results'
};

Object.entries(requiredElements).forEach(([label, elementId]) => {
    const exists = !!document.getElementById(elementId);
    const icon = exists ? '✅' : '❌';
    const status = exists ? 'OK' : 'BRAK';
    
    console.log(`${icon} ${label.padEnd(30)} → #${elementId.padEnd(25)} [${status}]`);
    
    if (!exists) {
        allOk = false;
    }
});

console.log('───────────────────────────────────────────────────────────');

// Sprawdzenie załadowanych skryptów
console.log('\n📜 SPRAWDZANIE ZAŁADOWANYCH SKRYPTÓW:');
console.log('───────────────────────────────────────────────────────────');

const scripts = Array.from(document.querySelectorAll('script[src]'));
const requiredScripts = [
    'supabase-client-fixed.js',
    'bulk-import.js',
    'main2.js'
];

requiredScripts.forEach(scriptName => {
    const loaded = scripts.some(s => s.src.includes(scriptName));
    const icon = loaded ? '✅' : '❌';
    const status = loaded ? 'ZAŁADOWANY' : 'BRAK';
    
    console.log(`${icon} ${scriptName.padEnd(30)} [${status}]`);
    
    if (!loaded) {
        allOk = false;
    }
});

console.log('───────────────────────────────────────────────────────────');

// Test generowania szablonu
console.log('\n🧪 TEST GENEROWANIA SZABLONU:');
console.log('───────────────────────────────────────────────────────────');

if (typeof generateCSVTemplate === 'function') {
    try {
        const template = generateCSVTemplate();
        const lines = template.split('\n');
        console.log('✅ Szablon wygenerowany pomyślnie!');
        console.log(`   - Liczba linii: ${lines.length}`);
        console.log(`   - Rozmiar: ${template.length} znaków`);
        console.log(`   - Pierwszy wiersz (nagłówki):`);
        console.log(`     ${lines[0]}`);
    } catch (error) {
        console.error('❌ Błąd podczas generowania szablonu:', error.message);
        allOk = false;
    }
} else {
    console.log('❌ Funkcja generateCSVTemplate nie jest dostępna');
}

console.log('───────────────────────────────────────────────────────────');

// Podsumowanie
console.log('\n📊 PODSUMOWANIE:');
console.log('═══════════════════════════════════════════════════════════');

if (allOk) {
    console.log('%c✅ WSZYSTKO DZIAŁA POPRAWNIE!', 'font-size: 16px; font-weight: bold; color: #10b981;');
    console.log('\nFunkcje importu są gotowe do użycia.');
    console.log('Możesz teraz bezpiecznie importować produkty.');
} else {
    console.log('%c❌ ZNALEZIONO PROBLEMY!', 'font-size: 16px; font-weight: bold; color: #ef4444;');
    
    if (missing.length > 0) {
        console.log('\n🔧 Brakujące funkcje:');
        missing.forEach(fn => console.log(`   - ${fn}`));
        console.log('\n💡 Rozwiązanie:');
        console.log('   1. Sprawdź czy bulk-import.js jest załadowany');
        console.log('   2. Sprawdź kolejność ładowania skryptów w index.html');
        console.log('   3. Wyczyść cache przeglądarki (Ctrl+Shift+Delete)');
        console.log('   4. Odśwież stronę (Ctrl+F5)');
    }
}

console.log('═══════════════════════════════════════════════════════════');

// Dodatkowe funkcje pomocnicze
console.log('\n🛠️ DOSTĘPNE FUNKCJE POMOCNICZE:');
console.log('───────────────────────────────────────────────────────────');
console.log('Wpisz w konsoli:');
console.log('  testDownloadTemplate()  - Test pobierania szablonu');
console.log('  testParseCSV()          - Test parsowania CSV');
console.log('  showImportModal()       - Otwórz modal importu');
console.log('═══════════════════════════════════════════════════════════');

// Funkcje pomocnicze
window.testDownloadTemplate = function() {
    if (typeof generateCSVTemplate !== 'function' || typeof downloadCSV !== 'function') {
        console.error('❌ Funkcje nie są dostępne!');
        return;
    }
    
    try {
        const template = generateCSVTemplate();
        downloadCSV(template, 'test-template.csv');
        console.log('✅ Szablon został pobrany jako test-template.csv');
    } catch (error) {
        console.error('❌ Błąd:', error.message);
    }
};

window.testParseCSV = function() {
    const testCSV = `id,name,price,currency,image,category,link,status,clicks,popular
1,Test Product,99.99,PLN,https://example.com/img.jpg,Test,https://example.com,active,0,false`;
    
    if (typeof parseCSV !== 'function') {
        console.error('❌ Funkcja parseCSV nie jest dostępna!');
        return;
    }
    
    try {
        const products = parseCSV(testCSV);
        console.log('✅ CSV sparsowany pomyślnie!');
        console.log('Liczba produktów:', products.length);
        console.log('Produkty:', products);
    } catch (error) {
        console.error('❌ Błąd:', error.message);
    }
};

window.showImportModal = function() {
    const modal = document.getElementById('import-products-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        console.log('✅ Modal importu otwarty');
    } else {
        console.error('❌ Modal importu nie znaleziony');
    }
};

console.log('\n✨ Diagnostyka zakończona!');
