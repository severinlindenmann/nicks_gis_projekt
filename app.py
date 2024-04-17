import os
import psycopg2
import psycopg2.extras
import geojson
from flask import Flask, request, render_template, jsonify
# from flask_cors import CORS
import json
from contextlib import closing


app = Flask(__name__, static_folder = 'static')
# CORS(app)
app.config.from_object(__name__)
app.config.from_pyfile('settings.py', silent=False)

# Setzen des Debug-Modus basierend auf der FLASK_DEBUG Umgebungsvariable
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', '0') == '1'

MAPBOX_ACCESS_KEY = app.config['MAPBOX_ACCESS_KEY']



connection = psycopg2.connect(user=app.config["DB_USER"],
                              password=app.config["DB_PASSWORD"],
                              host=app.config["DB_HOST"],
                              port=app.config["DB_PORT"],
                              database=app.config["DB_NAME"])

mycursor = connection.cursor()


# ================== TOPOLOGY ========================

@app.route('/')
def index():
    return render_template('dashboard.html')

# -------------- SEE ------------------ 

@app.route('/topology_lake_dd')
def get_lakes():
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    cur.execute('SELECT id, id1 FROM public.seen_poly ORDER BY id1 ASC')
    lakes = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(lakes)


@app.route('/topology_lake_map/<lake_id>')
def get_lake_geom(lake_id):
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    cur.execute("""SELECT ST_AsGeoJSON(ST_Transform(geom, 4326)) FROM public.seen_poly WHERE id = %s""", (lake_id,))
    
    geom_data = cur.fetchone()
    print(geom_data)
    cur.close()
    conn.close()
    if geom_data:
        return jsonify(geom=json.loads(geom_data[0]))
    else:
        return jsonify(error='See nicht gefunden'), 404

# -------------- KANTON ------------------ 

@app.route('/topology_canton_dd')
def get_cantons():
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    cur.execute('SELECT id, name FROM public.kanton ORDER BY name ASC')
    cantones = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(cantones)


@app.route('/topology_canton_map/<canton_id>')
def get_canton_geom(canton_id):
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    cur.execute("""SELECT ST_AsGeoJSON(ST_Transform(geom, 4326)) FROM public.kanton WHERE id = %s""", (canton_id,))
    
    
    geom_data = cur.fetchone()
    print(geom_data)
    cur.close()
    conn.close()
    if geom_data:
        return jsonify(geom=json.loads(geom_data[0]))
    else:
        return jsonify(error='Kanton nicht gefunden'), 404

# ---------------- CHECK INTERSECTION ---------------------
    
"""@app.route('/check_intersection/<lake_id>/<canton_id>')
def check_intersection(lake_id, canton_id):
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], 
        user=app.config["DB_USER"], 
        password=app.config["DB_PASSWORD"], 
        host=app.config["DB_HOST"], 
        port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    cur.execute(
        SELECT EXISTS (
            SELECT 1 
            FROM public.seen_poly AS seen 
            JOIN public.kanton AS kantone
            ON ST_Intersects(seen.geom, kantone.geom) 
            WHERE seen.id = %s AND kantone.id = %s
        )
    , (lake_id, canton_id))
    intersects = cur.fetchone()[0]
    cur.close()
    conn.close()
    return jsonify(intersects=intersects)"""


# ---------------- CHECK TYPOLOGY ---------------------

@app.route('/check_topology/<lake_id>/<canton_id>')
def check_topology(lake_id, canton_id):
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], 
        user=app.config["DB_USER"], 
        password=app.config["DB_PASSWORD"], 
        host=app.config["DB_HOST"], 
        port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    # Erstelle eine Abfrage, die alle topologischen Relationen überprüft
    query = """
        SELECT 
            CASE
                WHEN ST_Disjoint(lake.geom, canton.geom) THEN 'disjoint'
                WHEN ST_Touches(lake.geom, canton.geom) THEN 'meet'
                WHEN ST_Overlaps(lake.geom, canton.geom) THEN 'overlap'
                WHEN ST_Contains(canton.geom, lake.geom) THEN 'contains'
                WHEN ST_Within(lake.geom, canton.geom) THEN 'inside'
                WHEN ST_Covers(canton.geom, lake.geom) THEN 'covers'
                WHEN ST_CoveredBy(lake.geom, canton.geom) THEN 'covered by'
                WHEN ST_Equals(lake.geom, canton.geom) THEN 'equal'
                ELSE 'unknown'
            END AS topology_relation
        FROM public.seen_poly AS lake, public.kanton AS canton
        WHERE lake.id = %s AND canton.id = %s
    """
    cur.execute(query, (lake_id, canton_id))
    relation = cur.fetchone()[0]
    cur.close()
    conn.close()
    return jsonify(relation=relation)



# ================== KNN ========================

@app.route('/knn')
def knn():
    print("Laden der KNN-Seite")
    return render_template('dashboard.html')

# ---------------- GET KNN ---------------------

def getNearestNeighbors(long, lat, limit):
    print(f"Suche nach den nächsten {limit} Krankenhäusern bei [{long}, {lat}]")
    conn = psycopg2.connect(database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"])
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute('''WITH querypoint AS (
                    SELECT ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 2056) AS geom
                ),
                nearest_hospitals AS (
                    SELECT c1.id, c1.spital_kli, c1.geom,
                    ST_Distance(c1.geom, querypoint.geom) AS distance
                    FROM public.spitaeler_points c1, querypoint
                    ORDER BY c1.geom <-> querypoint.geom
                    LIMIT %s
                )
                SELECT json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(
                        json_build_object(
                            'type', 'Feature',
                            'geometry', ST_AsGeoJSON(ST_Transform(nearest_hospitals.geom, 4326))::json,
                            'properties', json_build_object(
                                'id', nearest_hospitals.id,
                                'name', nearest_hospitals.spital_kli,
                                'distance', nearest_hospitals.distance
                            )
                        )
                    )
                )
                FROM nearest_hospitals;
                ''',
                (long, lat, limit))

    geojson = cur.fetchone()[0]
    cur.close()
    conn.close()

    # print(geojson)
    return geojson

@app.route('/getNearestHospitals', methods=['GET'])
def getNearestHospitals():
    print("Anfrage für die nächsten Krankenhäuser erhalten")
    long = request.args.get('long', type=float)
    lat = request.args.get('lat', type=float)
    limit = request.args.get('limit', default=1, type=int)  
    geojson = getNearestNeighbors(long, lat, limit)
    # print(geojson)
    return jsonify(geojson)


# ---------------- GET ALL HOSPITALS ---------------------

@app.route('/getAllHospitals') #ok
def getAllHospitals():
    print("Laden aller Krankenhäuser")
    try:
        conn = psycopg2.connect(database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"])
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute('''
                    SELECT json_build_object(
                        'type', 'Feature',
                        'properties', json_build_object(
                        'id', id,
                        'name', spital_kli
                    ),
                    'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json
                    ) AS feature

                    FROM spitaeler_points;
                    ''')
        # print(cur)
        rows = cur.fetchall()
        # print(rows)
        features = [row['feature'] for row in rows]
        # print(features)
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        # print(geojson)
        cur.close()
        conn.close()

        return jsonify(geojson)
    
    except Exception as e:
        print(f"Fehler: {e}")
        return jsonify({"error": "Ein Fehler ist aufgetreten"}), 500

# ================== POINTS-IN-POLYGON ========================
    
# ------------ SHOW CANTONS CHLOROPLETH MAP ----------------

@app.route('/cantons_hospitals_ratio')
def get_cantons_hospitals_ratio():
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    
    # SQL-Abfrage, die die benötigten Daten holt und das Verhältnis berechnet
    cur.execute("""
                SELECT
                k.abk AS Kanton,
                COUNT(sp.id) AS Anzahl_Spitaler,
                k.einwohnerz AS Einwohnerzahl,
                k.einwohnerz::float / (COUNT(sp.id)) AS Verhaltnis_Einwohner_pro_Spital,
                ST_AsGeoJSON(ST_Transform(k.geom, 4326)) AS Kanton_Geometrie
                FROM
                public.spitaeler_points sp
                JOIN
                public.kanton k ON sp.kanton = k.abk
                GROUP BY
                k.abk, k.einwohnerz, k.geom
                ORDER BY
                Verhaltnis_Einwohner_pro_Spital DESC
    """)
    
# Erstellen des GeoJSON-Objekts
    features = []
    for row in cur.fetchall():
        feature = {
            "type": "Feature",
            "properties": {
                "Kanton": row[0],
                "Anzahl_Spitaler": row[1],
                "Einwohnerzahl": row[2],
                "Verhaltnis_Einwohner_pro_Spital": row[3]
            },
            "geometry": json.loads(row[4]) 
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }

    cur.close()
    conn.close()
    
    return jsonify(geojson)

# ------------ HOSPITALS PER CANTON  ----------------

@app.route('/spital_details/<kanton>')
def get_spital_details(kanton):
    conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], 
        password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], 
        port=app.config["DB_PORT"]
    )
    cur = conn.cursor()
    
    # Abfrage für die Einwohnerzahl und Anzahl der Spitäler im Kanton
    cur.execute("""
    SELECT k.einwohnerz, COUNT(sp.id)
    FROM public.kanton k
    LEFT JOIN public.spitaeler_points sp ON k.abk = sp.kanton
    WHERE k.abk = %s
    GROUP BY k.einwohnerz
    """, (kanton,))
    
    einwohnerz, spitalanzahl = cur.fetchone()

    # Abfrage für die Namen der Spitäler im Kanton
    cur.execute("""
    SELECT spital_kli
    FROM public.spitaeler_points
    WHERE kanton = %s
    """, (kanton,))
    
    spitalnamen = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()
    
    return jsonify({
        'einwohnerProSpital': einwohnerz / spitalanzahl if spitalanzahl else 0,
        'spitalNamen': spitalnamen
    })


# ================= POINT-LINE ======================

# Route zum Finden von Spitälern nahe Flüssen
@app.route('/findHospitalsNearRiver')
def find_hospitals_near_river():
    distance = request.args.get('distance', default=1000, type=int)  # Entfernung in Metern
    try:
        conn = psycopg2.connect(
        database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
    )
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # SQL-Abfrage
        sql = """
            SELECT DISTINCT ON (s.id) s.id, s.spital_kli, ST_AsGeoJSON(ST_Transform(s.geom, 4326))::json AS geometry, 
            f.grosserflu AS river_name, ST_Distance(s.geom, f.geom) AS distance_to_river
            FROM public.spitaeler_points s
            JOIN public.fluesse_line f ON ST_DWithin(s.geom, f.geom, %s)
            ORDER BY s.id, ST_Distance(s.geom, f.geom);

        """
        
        cur.execute(sql, [distance])
        hospitals = cur.fetchall()
        print(hospitals)
        # Konvertieren Sie die Ergebnisse in ein GeoJSON-Format
        geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "id": hospital["id"],
                    "name": hospital["spital_kli"],
                    "distanceToRiver": hospital["distance_to_river"],
                    "riverName": hospital["river_name"]  
        },
        "geometry": hospital["geometry"]
    } for hospital in hospitals]
}



        # print(geojson)
        return jsonify(geojson)
    
    except Exception as e:
        print(e)
        return jsonify({"error": "Ein Fehler ist aufgetreten"}), 500
    
    finally:
        if conn:
            conn.close()

# ================== POINT-POLY-POINT ======================
# ----------------

conn = psycopg2.connect(
    database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], host=app.config["DB_HOST"], port=app.config["DB_PORT"]
)

@app.route('/findHospitalsByDistance', methods=['POST'])
def find_hospitals_by_distance():
    data = request.json
    distance_to_station = data['distance_to_station']  # Distanz zu ÖV-Haltestelle
    distance_to_lake = data['distance_to_lake']  # Distanz zu Seen
    
    cur = conn.cursor()
    
    # Erweiterte SQL-Abfrage
    query = f"""
    SELECT s.id, s.spital_kli,
           ST_AsGeoJSON(ST_Transform(s.geom, 4326))::json AS geom,
           sb.name AS nearest_station_name,
           ST_Distance(s.geom, sb.geom) AS distance_to_nearest_station,
           sp.id1 AS nearest_lake_name,
           ST_Distance(s.geom, sp.geom) AS distance_to_nearest_lake
    FROM public.spitaeler_points s,
         LATERAL (
           SELECT sb.id, sb.geom, sb.remark AS name
           FROM public.sbb_points sb
           ORDER BY s.geom <-> sb.geom
           LIMIT 1
         ) sb,
         LATERAL (
           SELECT sp.id, sp.geom, sp.id1
           FROM public.seen_poly sp
           ORDER BY s.geom <-> sp.geom
           LIMIT 1
         ) sp
    WHERE ST_DWithin(s.geom, sb.geom, %s)
      AND ST_DWithin(s.geom, sp.geom, %s);
    """
    
    cur.execute(query, (distance_to_station, distance_to_lake))
    
    # Ergebnisse abrufen und in GeoJSON umwandeln
    features = []
    for row in cur.fetchall():
        feature = {
            "type": "Feature",
            "properties": {
                "id": row[0],
                "name": row[1],
                "nearestStationName": row[3],
                "distanceToNearestStation": row[4],
                "nearestLakeName": row[5],
                "distanceToNearestLake": row[6]
            },
            "geometry": row[2]
        }
        features.append(feature)
    
    cur.close()
    
    # GeoJSON-FeatureCollection zurückgeben
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    print(geojson)
    return jsonify(geojson)



# ================== POINT-IN-BOX ======================

# Datenbankverbindung herstellen
conn = psycopg2.connect(database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], 
                        host=app.config["DB_HOST"], port=app.config["DB_PORT"])

@app.route('/getHospitals', methods=['GET'])
def get_hospitals():
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute('''
                    SELECT json_build_object(
                        'type', 'FeatureCollection',
                        'features', json_agg(
                            json_build_object(
                                'type', 'Feature',
                                'properties', json_build_object(
                                    'id', id,
                                    'name', spital_kli
                                ),
                                'geometry', ST_AsGeoJSON(ST_Transform(geom, 4326))::json
                            )
                        )
                    ) AS feature_collection
                    FROM spitaeler_points;
                    ''')
        result = cur.fetchone()[0]
    return jsonify(result)



@app.route('/getHospitalsInArea', methods=['POST'])
def get_hospitals_in_area():
    area = request.json['area']
    
    # Überprüfen, ob das Polygon gültig ist
    if len(area) < 4 or area[0] != area[-1]:
        return jsonify({"error": "Ungültiges Polygon. Ein Polygon muss mindestens drei eindeutige Punkte enthalten plus eine Wiederholung des ersten Punkts am Ende."}), 400
    
    # Erstellen der WKT-Repräsentation des Polygons
    area_wkt = f"SRID=4326;POLYGON(({','.join([' '.join(map(str, coord)) for coord in area])}))"

    
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        query = """
        SELECT id, spital_kli AS name, ambulant, reha, psychiatri, ips, betten, operations, gebärsäl,
        ST_AsGeoJSON(ST_Transform(geom, 4326))::json AS geometry
        FROM public.spitaeler_points
        WHERE ST_Within(ST_Transform(geom, 4326), ST_GeomFromText(%s, 4326));
        """
        cur.execute(query, (area_wkt,))
        
        features = [{
            "type": "Feature",
            "properties": {
                "id": row['id'],
                "name": row['name'],
                "ambulant": row['ambulant'],
                "reha": row['reha'],
                "psychiatri": row['psychiatri'],
                "ips": row['ips'],
                "betten": row['betten'],
                "operations": row['operations'],
                "gebärsäl": row['gebärsäl']
            },
            "geometry": row['geometry']
        } for row in cur.fetchall()]

    print("ausgabe features: {}".format(features))
    print("ausgabe query: {}, {}".format(query, area_wkt))


    return jsonify({"type": "FeatureCollection", "features": features})


# ---------------------- ST_VoronoiPolygons -----------------------

@app.route('/voronoi')
def get_voronoi_polygons():
    # Datenbankverbindung herstellen
    conn = psycopg2.connect(database=app.config["DB_NAME"], user=app.config["DB_USER"], password=app.config["DB_PASSWORD"], 
                        host=app.config["DB_HOST"], port=app.config["DB_PORT"])
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # SQL-Abfrage ausführen
    cur.execute("SELECT ST_AsGeoJSON(ST_VoronoiPolygons(ST_Collect(ST_Transform(geom, 4326)))) AS voronoi FROM public.spitaeler_points;")
    result = cur.fetchone()
    print(result)
    # Verbindung schliessen
    cur.close()
    conn.close()

    # Ergebnis als GeoJSON zurückgeben
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=8000)
