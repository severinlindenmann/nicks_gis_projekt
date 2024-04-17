// Globale Variable
let mapType = 'topology'; // Standardmässig 'topology'
var isDrawControlAdded = false;


// Initialisieren der Karte
mapboxgl.accessToken = 'pk.eyJ1Ijoibmljazk2IiwiYSI6ImNsYnl4ZGJjbzExNDEzcXAzNXBocDcwc3UifQ.u8RsiA3nSDm_HG5S8hw5Sw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [8.3, 46.8],
    zoom: 7,
    transformRequest: (url, resourceType) => {
        if (resourceType === 'Source' && url.startsWith('http://localhost')) {
            return {
                url: url.replace('http', 'https'),
                headers: { 'my-custom-header': true },
                credentials: 'include'  // Include cookies for cross-origin requests
            };
        }
    }
});

map.getCanvas().style.cursor = "default";
$('.mapboxgl-ctrl-logo').remove();
$('.mapboxgl-ctrl-attrib-inner').remove();

// Zoom- und Drehsteuerungen zur Karte hinzufügen
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// Mapbox GL Draw initialisieren
var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    }
});


// ====================== Hilfsfunktionen ==================

function makeKnnLayersVisible() {
    console.log("mache visible")
    // Überprüfen und Sichtbarkeit von 'hospitals-layer' ändern
    if (map.getLayer('hospitals-layer')) {
        map.setLayoutProperty('hospitals-layer', 'visibility', 'visible');
        // console.log("bin visible hospitals-layer")
    }
    // Überprüfen und Sichtbarkeit von 'selected-hospitals-layer' ändern
    if (map.getLayer('selected-hospitals-layer')) {
        map.setLayoutProperty('selected-hospitals-layer', 'visibility', 'visible');
        // console.log("bin visible selected-hospitals-layer")
    }
}

function makeKnnLayersInvisible() {
    // Sichtbarkeit des Layers 'hospitals-layer' ändern, falls vorhanden
    if (map.getLayer('hospitals-layer')) {
        map.setLayoutProperty('hospitals-layer', 'visibility', 'none');
    }
    // Sichtbarkeit des Layers 'selected-hospitals-layer' ändern, falls vorhanden
    if (map.getLayer('selected-hospitals-layer')) {
        map.setLayoutProperty('selected-hospitals-layer', 'visibility', 'none');
    }
}

function makeTopologyLayersVisible() {
    // Überprüfen und Sichtbarkeit von 'selected-lake-layer' ändern
    if (map.getLayer('selected-lake-layer')) {
        map.setLayoutProperty('selected-lake-layer', 'visibility', 'visible');
    }
    // Überprüfen und Sichtbarkeit von 'selected-canton-layer' ändern
    if (map.getLayer('selected-canton-layer')) {
        map.setLayoutProperty('selected-canton-layer', 'visibility', 'visible');
    }
}

function makeTopologyLayersInvisible() {
    // Sichtbarkeit des Layers 'selected-lake-layer' ändern, falls vorhanden
    if (map.getLayer('selected-lake-layer')) {
        map.setLayoutProperty('selected-lake-layer', 'visibility', 'none');
    }
    // Sichtbarkeit des Layers 'selected-canton-layer' ändern, falls vorhanden
    if (map.getLayer('selected-canton-layer')) {
        map.setLayoutProperty('selected-canton-layer', 'visibility', 'none');
    }
}

// Funktionen zum Ein- und Ausblenden der Layers für Point-in-Polygon
function makePointsInPolygonLayerVisible() {
    if (map.getLayer('cantons-fill')) {
        map.setLayoutProperty('cantons-fill', 'visibility', 'visible');
    }
    if (map.getLayer('cantons-outline')) {
        map.setLayoutProperty('cantons-outline', 'visibility', 'visible');
    }
}

function makePointsInPolygonLayerInvisible() {
    if (map.getLayer('cantons-fill')) {
        map.setLayoutProperty('cantons-fill', 'visibility', 'none');
    }
    if (map.getLayer('cantons-outline')) {
        map.setLayoutProperty('cantons-outline', 'visibility', 'none');
    }
}

// Funktionen zum Ein- und Ausblenden der Layers für Point-Line
function makePointLineLayerVisible() {
    if (map.getLayer('nearby-hospitals-layer')) {
        map.setLayoutProperty('nearby-hospitals-layer', 'visibility', 'visible');
    }
}

function makePointLineLayerInvisible() {
    if (map.getLayer('nearby-hospitals-layer')) {
        map.setLayoutProperty('nearby-hospitals-layer', 'visibility', 'none');
    }
}

// Funktionen zum Ein- und Ausblenden der Layers für Point-Line
function makePointPolygonPointLayerVisible() {
    if (map.getLayer('ppp-hospitals-layer')) {
        map.setLayoutProperty('ppp-hospitals-layer', 'visibility', 'visible');
    }
}

function makePointPolygonPointLayerInvisible() {
    if (map.getLayer('ppp-hospitals-layer')) {
        map.setLayoutProperty('ppp-hospitals-layer', 'visibility', 'none');
    }
}

function makePointInBoxLayersVisible() {
    // console.log("mache visible")
    // Überprüfen und Sichtbarkeit von 'hospitals-layer' ändern
    if (map.getLayer('all-hospitals-layer')) {
        map.setLayoutProperty('all-hospitals-layer', 'visibility', 'visible');
    }
    // Überprüfen und Sichtbarkeit von 'highlighted-hospitals-layer' ändern
    if (map.getLayer('highlighted-hospitals-layer')) {
        map.setLayoutProperty('highlighted-hospitals-layer', 'visibility', 'visible');
    }
    // Sichtbarkeit des Layers 'voronoi-layer' ändern, falls vorhanden
    if (map.getLayer('voronoi-layer')) {
        map.setLayoutProperty('voronoi-layer', 'visibility', 'visible');
    }
}

function makePointInBoxLayersInvisible() {
    // Sichtbarkeit des Layers 'hospitals-layer' ändern, falls vorhanden
    if (map.getLayer('all-hospitals-layer')) {
        map.setLayoutProperty('all-hospitals-layer', 'visibility', 'none');
    }
    // Sichtbarkeit des Layers 'highlighted-hospitals-layer' ändern, falls vorhanden
    if (map.getLayer('highlighted-hospitals-layer')) {
        map.setLayoutProperty('highlighted-hospitals-layer', 'visibility', 'none');
    }
    // Sichtbarkeit des Layers 'voronoi-layer' ändern, falls vorhanden
    if (map.getLayer('voronoi-layer')) {
        map.setLayoutProperty('voronoi-layer', 'visibility', 'none');
    }
}

// ------------------ SHOW LEGEND OF CHLOROPLETH MAP ------------------------
function updateLegend() {
    console.log("legende")
    const legendItems = [
        { color: '#f8d5cc', value: "< 15'000 Einwohner pro Spital" },
        { color: '#f4bfb6', value: "15'000 - 30'000 Einwohner pro Spital" },
        { color: '#f1a8a5', value: "30'000 - 45'000 Einwohner pro Spital" },
        { color: '#ee8f9a', value: "45'000 - 60'000 Einwohner pro Spital" },
        { color: '#ec739b', value: "> 60'000 Einwohner pro Spital" },
    ];

    const legendElement = document.getElementById('legend-items');
    legendElement.innerHTML = ''; // Clear existing legend items

    legendItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('legend-item');

        const colorElement = document.createElement('div');
        colorElement.classList.add('legend-color');
        colorElement.style.backgroundColor = item.color;

        const textElement = document.createElement('div');
        textElement.classList.add('legend-text');
        textElement.textContent = item.value;

        itemElement.appendChild(colorElement);
        itemElement.appendChild(textElement);
        legendElement.appendChild(itemElement);
    });
}

function loadChloroplethMap() {
    console.log("map");
    // Funktion, um die Chloropleth Map zu laden
    // Sicherstellen, dass diese Funktion nur aufgerufen wird, wenn mapType 'point-in-polygon' ist
    if (mapType === 'point-in-polygon') {
        fetch('/cantons_hospitals_ratio')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                map.addSource('cantons', {
                    'type': 'geojson',
                    'data': data
                });

                map.addLayer({
                    'id': 'cantons-fill',
                    'type': 'fill',
                    'source': 'cantons',
                    'layout': {},
                    'paint': {
                        'fill-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'Verhaltnis_Einwohner_pro_Spital'],
                            0, '#f8d5cc',
                            15000, '#f4bfb6',
                            30000, '#f1a8a5',
                            45000, '#ee8f9a',
                            60000, '#ec739b',
                        ],
                        'fill-opacity': 0.8

                    }
                });

                map.addLayer({
                    'id': 'cantons-outline',
                    'type': 'line',
                    'source': 'cantons',
                    'layout': {},
                    'paint': {
                        'line-color': '#ffffff', // weiss 
                        'line-width': 1
                    }
                });
                // Überprüfe, ob der `highlight-border`-Layer bereits existiert
                if (map.getLayer('highlight-border')) {
                    // Verschiebe den `highlight-border`-Layer an die letzte Stelle
                    map.moveLayer('highlight-border');
                }


            }).catch(error => {
                console.error('There was a problem with your fetch operation:', error);
            });

        map.on('click', 'cantons-fill', function (e) {
            const kanton = e.features[0].properties.Kanton;
            fetch(`/spital_details/${kanton}`)
                .then(response => response.json())
                .then(data => {
                    // Daten in der Side-Bar anzeigen
                    document.getElementById('details-container').innerHTML = `
                <h3>Details für ${kanton}</h3>
                <p>Einwohner pro Spital: ${data.einwohnerProSpital.toFixed(2)}</p>
                <h4>Spitäler:</h4>
                <ul>
                    ${data.spitalNamen.map(name => `<li>${name}</li>`).join('')}
                </ul>
            `;
                });
        });

        map.on('load', function () {

            // Hinzufügen eines leeren GeoJSON als Quelle für den Hover-State
            map.addSource('highlight-feature', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            console.log("kontur");
            // Hinzufügen eines Layer, der die Kontur der gehoverten Kantone anzeigt
            map.addLayer({
                id: 'highlight-border',
                type: 'line',
                source: 'highlight-feature',
                layout: {},
                paint: {
                    'line-color': '#ff0000', // Farbe der Kontur (Rot)
                    'line-width': 2 // Dicke der Linie
                }
            });

        });

        let currentHoverId = null;

        map.on('mousemove', 'cantons-fill', function (e) {
            // Aktualisiert die Kontur für den Kanton, über den der Benutzer hovert
            if (e.features.length > 0) {
                if (currentHoverId !== e.features[0].id) {
                    currentHoverId = e.features[0].id;
                    map.getSource('highlight-feature').setData(e.features[0].geometry);
                }
            }
        });

        map.on('mouseleave', 'cantons-fill', function () {
            // Entfernt die Kontur, wenn der Benutzer den Kanton verlässt
            map.getSource('highlight-feature').setData({
                type: 'FeatureCollection',
                features: []
            });
            currentHoverId = null; // Zurücksetzen der aktuellen Hover-ID
        });
    }
}

function checkIntersection() {
    const selectedLakeId = document.getElementById('lake-select').value;
    const selectedCantonId = document.getElementById('canton-select').value;
    if (selectedLakeId && selectedCantonId) {
        fetch(`/check_topology/${selectedLakeId}/${selectedCantonId}`)
            .then(response => response.json())
            .then(data => {
                // Anpassung, um die spezifische topologische Relation anzuzeigen
                const relation = data.relation;
                let message = "Unbekannte Relation";
                switch (relation) {
                    case 'disjoint':
                        message = "Die Flächen sind disjunkt. (disjoint)";
                        break;
                    case 'meet':
                        message = "Die Flächen berühren sich. (meet)";
                        break;
                    case 'overlap':
                        message = "Die Flächen überlappen sich. (overlap)";
                        break;
                    case 'contains':
                        message = "Der Kanton enthält den See.(contains)";
                        break;
                    case 'inside':
                        message = "Der See liegt innerhalb des Kantons. (inside)";
                        break;
                    case 'covers':
                        message = "Der Kanton bedeckt den See. (covers)";
                        break;
                    case 'covered by':
                        message = "Der See wird vom Kanton bedeckt. covered by";
                        break;
                    case 'equal':
                        message = "Die Flächen sind gleich. (equal)";
                        break;
                    default:
                        // Diese Nachricht wird angezeigt, wenn eine unbekannte Relation zurückgegeben wird
                        message = "Die Relation ist unbekannt.";
                        break;
                }
                document.getElementById('intersection-response').textContent = message;
                // Vorhandene Logik in checkIntersection beibehalten...

                // Ergänzen Sie die Aufrufe nach der erfolgreichen Abfrage der topologischen Relation
                showSelectedLake(selectedLakeId);
                showSelectedCanton(selectedCantonId);

            })
            .catch(error => {
                console.error('Fehler beim Überprüfen der topologischen Relation:', error);
                document.getElementById('intersection-response').textContent = "Fehler bei der Anfrage.";
            });
    } else {
        // Benutzer darauf hinweisen, dass beide Auswahlmöglichkeiten getroffen werden müssen
        document.getElementById('intersection-response').textContent = "Bitte wählen Sie sowohl einen See als auch einen Kanton.";
    }
}

function showSelectedLake(lakeId) {
    fetch(`/topology_lake_map/${lakeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.geom) {
                map.getSource('selected-lake').setData(data.geom);
            } else {
                console.error('Geometrie des Sees konnte nicht geladen werden.');
            }
        })
        .catch(error => console.error('Fehler beim Laden der Geometrie des Sees:', error));
}

function showSelectedCanton(cantonId) {
    fetch(`/topology_canton_map/${cantonId}`)
        .then(response => response.json())
        .then(data => {
            if (data.geom) {
                map.getSource('selected-canton').setData(data.geom);
            } else {
                console.error('Geometrie des Kantons konnte nicht geladen werden.');
            }
        })
        .catch(error => console.error('Fehler beim Laden der Geometrie des Kantons:', error));
}


// ======================= SWITCH ==========================

function switchContent(mapType) {
    // Alle Inhalte im Side-Panel ausblenden
    document.querySelectorAll('#side-panel > div').forEach(div => {
        div.style.display = 'none';
    });

    // Alle Layer standardmässig unsichtbar machen
    makeTopologyLayersInvisible();
    makeKnnLayersInvisible();
    makePointsInPolygonLayerInvisible();
    map.setLayoutProperty('highlight-border', 'visibility', 'none'); // Verstecke Highlight-Border auf anderen Seiten
    makePointLineLayerInvisible();
    makePointPolygonPointLayerInvisible();
    makePointInBoxLayersInvisible();


    // Nur den relevanten Container sichtbar machen und die entsprechenden Layer sichtbar schalten
    switch (mapType) {
        case 'knn':
            document.getElementById('knn-container').style.display = 'block';
            makeKnnLayersVisible();
            break;
        case 'topology':
            document.getElementById('topology-container').style.display = 'block';
            makeTopologyLayersVisible();
            break;
        case 'point-in-polygon':
            document.getElementById('point-in-polygon-container').style.display = 'block';
            makePointsInPolygonLayerVisible();
            loadChloroplethMap(); // Lade Chloropleth Map nur für Point-in-Polygon
            updateLegend(); // Aktualisiere Legende nur für Point-in-Polygon
            map.setLayoutProperty('highlight-border', 'visibility', 'visible'); // Zeige Highlight-Border nur auf dieser Seite
            break;
        case 'point-line':
            document.getElementById('point-line-container').style.display = 'block';
            makePointLineLayerVisible();
            break;
        case 'point-poly-point':
            // Implementieren der Logik für 'point-poly-point'
            document.getElementById('point-poly-point-container').style.display = 'block';
            makePointPolygonPointLayerVisible();
            break;
        case 'point-in-box':
            // Implementieren Logik für 'point-in-box'
            document.getElementById('point-in-box-container').style.display = 'block';
            // makePointInBoxLayersVisible();

            break;
        default:
            // Optional: Handhabung für unbekannte mapType-Werte
            console.warn('Unbekannter Inhaltstyp:', mapType);
            break;
    }
    // Kontrollieren, ob die Zeichenwerkzeuge basierend auf mapType angezeigt werden sollen
    if (mapType === 'point-in-box') {
        if (!isDrawControlAdded) {
            map.addControl(draw, 'top-right');
            isDrawControlAdded = true; // Setze die Flagge, dass die Zeichensteuerung hinzugefügt wurde
        }
        makePointInBoxLayersVisible();
        document.getElementById('point-in-box-container').style.display = 'block';
    } else {
        if (isDrawControlAdded) {
            map.removeControl(draw);
            isDrawControlAdded = false; // Setze die Flagge zurück, dass die Zeichensteuerung entfernt wurde
        }
        // Verstecken oder Anzeigen anderer Inhalte basierend auf mapType
    }
}


// ======================= EVENT LISTENER ==========================

// DOMContentLoaded event listener um sicherzustellen, dass das Script nach dem Laden der Seite ausgeführt wird
document.addEventListener('DOMContentLoaded', function () {
    const menuLinks = document.querySelectorAll('#menu a');

    // Implementierung SwitchContent Funktion
    menuLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            mapType = this.getAttribute('data-map');
            console.log("Umschalten zu:", mapType);
            switchContent(mapType); // Aufruf der Funktion mit dem gewählten Maptype
        });
    });



    // ================== TOPOLOGY =======================
    // -------------------- KANTON ----------------------------

    // Laden der Kantone aus der Flask API
    fetch('/topology_canton_dd')
        .then(response => response.json())
        .then(data => {
            const cantonSelect = document.getElementById('canton-select');
            data.forEach(canton => {
                const option = document.createElement('option');
                option.value = canton.id; // Setzen der id als Wert
                option.textContent = canton.name; // Anzeigen des Seennamens
                cantonSelect.appendChild(option);
            });
        });


    map.on('load', function () {
        map.addSource('selected-canton', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [] // Initial leer, wird durch Auswahl gefüllt
                // console.log(features)
            }
        });

        map.addLayer({
            id: 'selected-canton-layer',
            type: 'fill',
            source: 'selected-canton',
            layout: {},
            paint: {
                'fill-color': '#F1C232', // Gelb
                'fill-opacity': 0.7
            }
        });
    });


    // -------------------- SEE ----------------------------

    // Laden der Seen aus der Flask API
    fetch('/topology_lake_dd')
        .then(response => response.json())
        .then(data => {
            const lakeSelect = document.getElementById('lake-select');
            data.forEach(lake => {
                const option = document.createElement('option');
                option.value = lake.id; // Setzen der id als Wert
                option.textContent = lake.name; // Anzeigen des Seennamens
                lakeSelect.appendChild(option);
            });
        });


    map.on('load', function () {
        map.addSource('selected-lake', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [] // Initial leer, wird durch Auswahl gefüllt
                // console.log(features)
            }
        });

        map.addLayer({
            id: 'selected-lake-layer',
            type: 'fill',
            source: 'selected-lake',
            layout: {},
            paint: {
                'fill-color': '#bf001d', // Rot (Blau #007cbf)
                'fill-opacity': 0.7
            }
        });
    });


    // EventListener für die Auswahl-Elemente
    const lakeSelect = document.getElementById('lake-select');
    const cantonSelect = document.getElementById('canton-select');
    lakeSelect.addEventListener('change', checkIntersection);
    cantonSelect.addEventListener('change', checkIntersection);



    // ============================ KNN ================================
    // ------------------ GET KNN ------------------------

    document.getElementById('hospital-range').oninput = function () {
        document.getElementById('range-value').textContent = this.value;
    };

    map.on('click', function (e) {
        // Stellt sicher, dass der Code nur auf der KNN-Seite ausgeführt wird
        if (mapType !== 'knn') {
            return; // Verhindert die Ausführung des Rests des Codes, wenn nicht auf KNN-Seite
        }

        const limit = document.getElementById('hospital-range').value;
        const long = e.lngLat.lng;
        const lat = e.lngLat.lat;
        console.log("click event")

        fetch(`/getNearestHospitals?long=${long}&lat=${lat}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                console.log("hier")
                if (map.getSource('selected-hospitals')) {
                    console.log("hier2")
                    map.getSource('selected-hospitals').setData(data) // Direkt das GeoJSON-Objekt setzen
                    console.log(data);
                } else {
                    console.log("hier3")
                    map.addSource('selected-hospitals', {
                        'type': 'geojson',
                        'data': data // Das GeoJSON-Objekt von der API
                    });

                    map.addLayer({
                        'id': 'selected-hospitals-layer',
                        'type': 'circle',
                        'source': 'selected-hospitals',
                        'paint': {
                            'circle-radius': 8,
                            'circle-color': '#FF0000' // Rote Punkte für ausgewählte Krankenhäuser
                        }

                    });
                }
                updateSidePanel(data.features); // Aktualisiert das Side Panel mit den ausgewählten Spitäler
            })
            .catch(error => console.error('Fehler beim Laden der ausgewählten Spitäler:', error));
    });



    // ------------------ SHOW K HOSPITALS IN SIDEBAR ------------------------

    function updateSidePanel(features) {
        const hospitalsList = document.getElementById('selected-hospitals-list');
        // Leeren des Bereichs für die Liste der ausgewählten Spitäler, um alte Einträge zu entfernen
        hospitalsList.innerHTML = '<h3>Nächstgelegene Spitäler:</h3>'; // Überschrift beibehalten

        features.forEach(feature => {
            const id = feature.properties.id;
            const name = feature.properties.name;
            const distance = feature.properties.distance.toFixed(2); // Distanz auf zwei Dezimalstellen runden

            // Erstellt ein Container-Element für jedes Spital
            const hospitalItem = document.createElement('div');
            hospitalItem.className = 'hospital-list-item';
            hospitalItem.style.marginBottom = "20px"; // Fügt eine freie Zeile (Abstand) bis zum nächsten Spital hinzu

            // Erstellt ein Element für den Namen des Spitals
            const hospitalName = document.createElement('div');
            hospitalName.innerHTML = `<strong>${name}</strong>`;
            hospitalName.style.fontWeight = "bold";

            // Erstellt ein Element für die Distanz
            const hospitalDistance = document.createElement('div');
            hospitalDistance.textContent = `${distance} Meter entfernt`;

            // Fügt den Namen und die Distanz zum Container hinzu
            hospitalItem.appendChild(hospitalName);
            hospitalItem.appendChild(hospitalDistance);

            // Fügt den Container zum Side Panel hinzu
            hospitalsList.appendChild(hospitalItem);
        });
    }

    // ------------------ GET ALL HOSPITALS ------------------------

    map.on('load', function () {
        fetch(`/getAllHospitals`)
            .then(response => response.json())
            .then(data => {
                map.addSource('hospitals', {
                    'type': 'geojson',
                    'data': data // Direkt das GeoJSON-Objekt aus der Antwort verwenden
                });
                map.addLayer({
                    'id': 'hospitals-layer',
                    'type': 'circle',
                    'source': 'hospitals',
                    'paint': {
                        'circle-radius': 5,
                        'circle-color': '#000000' // Schwarze Punkte für alle Spitäler
                    },
                    'layout': {
                        'visibility': 'none' // Setze diesen Layer initial auf unsichtbar
                    }
                });
            })
            .catch(error => console.error('Fehler beim Laden der Spitäler:', error));


    });


    // ============================ POINTS-IN-POLYGON ================================

    // ------------------ SHOW HOSPITALS IN CANTON  ------------------------

    map.on('click', 'cantons-fill', function (e) {
        const kanton = e.features[0].properties.Kanton;
        fetch(`/spital_details/${kanton}`)
            .then(response => response.json())
            .then(data => {
                // Daten in der Side-Bar anzeigen
                document.getElementById('details-container').innerHTML = `
                <h3>Details für ${kanton}</h3>
                <p>Einwohner pro Spital: ${data.einwohnerProSpital.toFixed(2)}</p>
                <h4>Spitäler:</h4>
                <ul>
                    ${data.spitalNamen.map(name => `<li>${name}</li>`).join('')}
                </ul>
            `;
            });
    });

    map.on('load', function () {

        // Hinzufügen eines leeren GeoJSON als Quelle für den Hover-State
        map.addSource('highlight-feature', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        console.log("kontur");
        // Hinzufügen eines Layer, der die Kontur der gehoverten Kantone anzeigt
        map.addLayer({
            id: 'highlight-border',
            type: 'line',
            source: 'highlight-feature',
            layout: {},
            paint: {
                'line-color': '#800000', // Farbe der Kontur (WeinRot)
                'line-width': 1 // Dicke der Linie
            }
        });

    });

    map.on('mousemove', 'cantons-fill', function (e) {
        // Prüfe, ob die Maus über einem Feature ist
        if (e.features.length > 0) {
            const feature = e.features[0];
            // Aktualisiere die Konturdaten für das aktuelle Feature, unabhängig von der currentHoverId
            map.getSource('highlight-feature').setData(feature.geometry);
        }
    });

    map.on('mouseleave', 'cantons-fill', function () {
        // Entferne die Konturdaten, wenn die Maus den Layer verlässt
        map.getSource('highlight-feature').setData({
            type: 'FeatureCollection',
            features: []
        });
        // Es ist kein Zurücksetzen der currentHoverId erforderlich
    });

    // ================== POINT-LINE ====================

    document.getElementById('find-hospitals').addEventListener('click', function () {
        const distance = document.getElementById('distance-input').value;
        if (!distance) {
            alert('Bitte eine gültige Entfernung eingeben.');
            return;
        }

        fetch(`/findHospitalsNearRiver?distance=${distance}`)
            .then(response => response.json())
            .then(data => {
                // Anzahl der gefundenen Spitäler im Side-Panel aktualisieren
                document.getElementById('hospital-count-pl').textContent = data.features.length;
                // Nehmen wir an, `data` ist ein GeoJSON-Objekt der nahegelegenen Spitäler
                if (map.getSource('nearby-hospitals')) {
                    map.getSource('nearby-hospitals').setData(data);
                } else {
                    map.addSource('nearby-hospitals', {
                        'type': 'geojson',
                        'data': data
                    });
                    map.addLayer({
                        'id': 'nearby-hospitals-layer',
                        'type': 'symbol',
                        'source': 'nearby-hospitals',
                        'layout': {
                            'icon-image': 'hospital-15',
                            'icon-size': 1.5
                        }
                    });
                }
            })
            .catch(error => console.error('Fehler beim Laden der Spitäler:', error));
    });

    // Ein einziges Popup-Objekt für die Wiederverwendung erstellen
    var hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mouseenter', 'nearby-hospitals-layer', function (e) {
        // Mauszeiger-Stil ändern
        map.getCanvas().style.cursor = 'pointer';
        // Erstellen eines HTML-Elements für das Popup
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = `<strong>${e.features[0].properties.name}</strong><br>
                   Distance to ${e.features[0].properties.riverName}: ${e.features[0].properties.distanceToRiver.toFixed(2)}m`;

        // Setzen Sie den Inhalt und die Position des bestehenden Popups
        hoverPopup.setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);

        // Stellen Sie sicher, dass das Popup nicht über den Kartenrand hinausragt
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
    });

    map.on('mouseleave', 'nearby-hospitals-layer', function () {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();  // Das Popup entfernen
    });


    // ==================== POINT-POLY-POINT =========================

    document.getElementById('find-hospitals-ppp').addEventListener('click', function () {
        const distanceToStation = document.getElementById('distance-to-station-input').value;
        const distanceToLake = document.getElementById('distance-to-lake-input').value;
        if (!distanceToStation || !distanceToLake) {
            alert('Bitte gültige Entfernungen eingeben.');
            return;
        }

        fetch('/findHospitalsByDistance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                distance_to_station: distanceToStation,
                distance_to_lake: distanceToLake
            })
        })
            .then(response => response.json())
            .then(data => {
                // Anzahl der gefundenen Spitäler im Side-Panel aktualisieren
                document.getElementById('hospital-count-ppp').textContent = data.features.length;

                if (map.getSource('ppp-hospitals')) {
                    map.getSource('ppp-hospitals').setData(data);
                } else {
                    map.addSource('ppp-hospitals', {
                        'type': 'geojson',
                        'data': data
                    });
                    map.addLayer({
                        'id': 'ppp-hospitals-layer',
                        'type': 'symbol',
                        'source': 'ppp-hospitals',
                        'layout': {
                            'icon-image': 'hospital-15',
                            'icon-size': 1.5
                        }
                    });
                }
            })
            .catch(error => console.error('Fehler beim Laden der Spitäler:', error));
    });

    // Verwende das vorhandene Popup-Objekt für Hover-Effekte
    map.on('mouseenter', 'ppp-hospitals-layer', function (e) {
        // Mauszeiger-Stil ändern
        map.getCanvas().style.cursor = 'pointer';

        var coordinates = e.features[0].geometry.coordinates.slice();
        var properties = e.features[0].properties;

        var description = `<strong>${properties.name}</strong><br>` +
            `Distanz zur nächsten ÖV-Haltestelle (${properties.nearestStationName}): ${properties.distanceToNearestStation.toFixed(2)}m<br>` +
            `Distanz zum nächsten See (${properties.nearestLakeName}): ${properties.distanceToNearestLake.toFixed(2)}m`;

        // Setzen Sie den Inhalt und die Position des bestehenden Popups
        hoverPopup.setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    map.on('mouseleave', 'ppp-hospitals-layer', function () {
        map.getCanvas().style.cursor = '';
        hoverPopup.remove();
    });


    // ======================= POINT-IN-BOX ==========================



    // Funktion, um die Koordinaten des gezeichneten Polygons zu erfassen und an das Backend zu senden
    function sendPolygonData() {
        var data = draw.getAll();
        if (data.features.length > 0) {
            var coords = data.features[0].geometry.coordinates[0];
            fetch('/getHospitalsInArea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ area: coords })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Erfolg:', data);
                    updateSelectedHospitals(data);

                    // Container für die ausgewählten Spitäler leeren
                    const hospitalsInfoContainer = document.getElementById('selected-hospitals-info');
                    hospitalsInfoContainer.innerHTML = 'Ausgewählte Spitäler: (Anklicken für mehr Infos)<br><br>';

                    // Für jedes Feature (Spitäler) ein Element erstellen
                    data.features.forEach(feature => {
                        const properties = feature.properties;

                        // Grundlegende Informationen
                        const hospitalElement = document.createElement('div');
                        hospitalElement.classList.add('hospital-info');
                        hospitalElement.innerHTML = `<strong>${properties.name}</strong>`;

                        // Container für detaillierte Informationen
                        const detailsContainer = document.createElement('div');
                        detailsContainer.classList.add('hospital-details');
                        detailsContainer.style.display = 'none'; // Standardmässig verstecken

                        // Detaillierte Informationen hinzufügen
                        const detailsHtml = `
                            <p>Ambulant: ${properties.ambulant || 'Nein'}</p>
                            <p>Reha: ${properties.reha || 'Nein'}</p>
                            <p>Psychiatrie: ${properties.psychiatri || 'Nein'}</p>
                            <p>IPS: ${properties.ips || 'Nein'}</p>
                            <p>Betten: ${properties.betten || 0}</p>
                            <p>Gebärsäle: ${properties.gebärsäl || 0}</p>
                        `;
                        detailsContainer.innerHTML = detailsHtml;

                        // Klick-Event, um Details ein-/auszublenden
                        hospitalElement.addEventListener('click', () => {
                            detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
                        });

                        hospitalsInfoContainer.appendChild(hospitalElement);
                        hospitalsInfoContainer.appendChild(detailsContainer);
                    });
                })
                .catch((error) => {
                    console.error('Fehler:', error);
                });
        } else {
            console.log("Bitte zeichne ein Polygon auf der Karte.");
        }
    }

    // Funktion, um ausgewählte Krankenhäuser auf der Karte anzuzeigen
    function updateSelectedHospitals(data) {
        // Entferne vorherige Auswahl von der Karte
        if (map.getSource('highlighted-hospitals')) {
            map.removeLayer('highlighted-hospitals-layer');
            map.removeSource('highlighted-hospitals');
        }

        // Füge die ausgewählten Krankenhäuser als neue Quelle hinzu
        map.addSource('highlighted-hospitals', {
            type: 'geojson',
            data: data
        });

        // Füge eine neue Ebene hinzu, um die ausgewählten Krankenhäuser in rot anzuzeigen
        map.addLayer({
            id: 'highlighted-hospitals-layer',
            type: 'circle',
            source: 'highlighted-hospitals',
            paint: {
                'circle-radius': 7,
                'circle-color': '#ff0000' // Rote Punkte
            }
        });

        // Aktualisiere das Side Panel
        const hospitalsInfoContainer = document.getElementById('selected-hospitals-info');
        hospitalsInfoContainer.innerHTML = ''; // Leere den Container für die ausgewählten Krankenhäuser

        // Mapping von Daten-Eigenschaftsnamen zu benutzerfreundlichen Bezeichnungen
        const detailLabels = {
            'ambulant': 'Ambulant',
            'reha': 'Reha',
            'psychiatri': 'Psychiatrie',
            'ips': 'IPS',
            'betten': 'Anz. Betten',
            'gebärsäl': 'Anz. Gebärsäle'
        };

        data.features.forEach((feature) => {
            const properties = feature.properties;

            // Grundlegende Informationen
            const hospitalElement = document.createElement('div');
            hospitalElement.classList.add('hospital-info');
            hospitalElement.innerHTML = `<strong>${properties.name}</strong>`; // Setze den Namen des Krankenhauses

            // Details-Container für weitere Informationen
            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('hospital-details');
            detailsContainer.style.display = 'none'; // Standardmäßig versteckt

            // Füge Details hinzu
            Object.entries(detailLabels).forEach(([key, label]) => {
                const detailElement = document.createElement('p');
                detailElement.textContent = `${label}: ${properties[key] || '-'}`; // Anzeige von 'Nein' als Fallback
                detailsContainer.appendChild(detailElement);
            });

            hospitalElement.appendChild(detailsContainer); // Füge den Details-Container hinzu
            hospitalsInfoContainer.appendChild(hospitalElement); // Füge das Krankenhaus-Element zum Container hinzu

            // Event-Listener für das Klicken auf das Krankenhaus, um Details ein-/auszublenden
            hospitalElement.addEventListener('click', function () {
                detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
            });
        });
    }

    // Event-Listener für das Ende des Zeichenvorgangs und für Aktualisierungen
    map.on('draw.create', sendPolygonData);
    map.on('draw.update', sendPolygonData);


    map.on('load', function () {
        // Zuerst die Voronoi-Polygone laden
        fetch('/voronoi')
            .then(response => response.json())
            .then(data => {
                const voronoiGeoJSON = JSON.parse(data.voronoi);
    
                // Füge die Voronoi-Quelle und den Layer hinzu
                map.addSource('voronoi-source', {
                    type: 'geojson',
                    data: voronoiGeoJSON
                });
                map.addLayer({
                    id: 'voronoi-layer',
                    type: 'line',
                    source: 'voronoi-source',
                    layout: {
                        'visibility': 'none'  // Setze die Sichtbarkeit des Layers auf unsichtbar
                    },
                    paint: {
                        'line-width': 1,
                        'line-color': '#5e2028',  // Weinrite Linien für Voronoi-Polygone
                //        'line-dasharray': [2, 10],  // gepunkteten Linie
                        'line-blur': 1, // leichter Unschärfeeffekt 
                        'line-opacity': 0.5 

                    }
                });
    
                // Lade nun die Spital-Daten
                return fetch('/getHospitals');
            })
            .then(response => response.json())
            .then(data => {
                map.addSource('all-hospitals', {
                    type: 'geojson',
                    data: data
                });
                map.addLayer({
                    id: 'all-hospitals-layer',
                    type: 'circle',
                    source: 'all-hospitals',
                    paint: {
                        'circle-radius': 5,
                        'circle-color': '#000000' // Schwarze Punkte für die Spitäler
                    },
                    'layout': {
                        'visibility': 'none' 
                    }
                });
            })
            .catch(error => console.error('Fehler beim Laden der Daten:', error));
    });
    
});
