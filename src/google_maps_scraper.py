"""
Pesquisa negócios locais via Google Maps Places API.
Filtra negócios sem website ou com website fraco.
"""

import time
import logging
import requests
from website_checker import verificar_website

logger = logging.getLogger(__name__)

PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

REGIOES_PT = [
    {"nome": "Lisboa",            "lat": 38.7169, "lng": -9.1399},
    {"nome": "Porto",             "lat": 41.1579, "lng": -8.6291},
    {"nome": "Braga",             "lat": 41.5454, "lng": -8.4265},
    {"nome": "Coimbra",           "lat": 40.2033, "lng": -8.4103},
    {"nome": "Faro",              "lat": 37.0194, "lng": -7.9322},
    {"nome": "Évora",             "lat": 38.5713, "lng": -7.9139},
    {"nome": "Setúbal",           "lat": 38.5244, "lng": -8.8882},
    {"nome": "Leiria",            "lat": 39.7437, "lng": -8.8071},
    {"nome": "Viseu",             "lat": 40.6574, "lng": -7.9125},
    {"nome": "Aveiro",            "lat": 40.6405, "lng": -8.6537},
    {"nome": "Guarda",            "lat": 40.5378, "lng": -7.2678},
    {"nome": "Bragança",          "lat": 41.8061, "lng": -6.7589},
    {"nome": "Vila Real",         "lat": 41.3006, "lng": -7.7457},
    {"nome": "Viana do Castelo",  "lat": 41.6918, "lng": -8.8307},
    {"nome": "Portalegre",        "lat": 39.2967, "lng": -7.4286},
    {"nome": "Beja",              "lat": 38.0155, "lng": -7.8646},
    {"nome": "Santarém",          "lat": 39.2369, "lng": -8.6873},
    {"nome": "Castelo Branco",    "lat": 39.8233, "lng": -7.4914},
    {"nome": "Funchal",           "lat": 32.6669, "lng": -16.9241},
    {"nome": "Câmara de Lobos",   "lat": 32.6497, "lng": -16.9774},
    {"nome": "Ponta Delgada",     "lat": 37.7412, "lng": -25.6756},
    {"nome": "Angra do Heroísmo", "lat": 38.6546, "lng": -27.2189},
    {"nome": "Horta",             "lat": 38.5317, "lng": -28.6268},
]

TIPOS_NEGOCIO = [
    "restaurant", "hair_care", "car_repair", "bakery", "pharmacy",
    "grocery_or_supermarket", "cafe", "electrician", "plumber",
    "beauty_salon", "clothing_store", "shoe_store", "florist",
    "jewelry_store", "laundry", "locksmith", "pet_store",
    "real_estate_agency", "gym", "veterinary_care", "dentist",
    "physiotherapist", "lawyer", "accounting",
]

TRADUCOES = {
    "restaurant": "Restaurante", "hair_care": "Cabeleireiro",
    "car_repair": "Mecânico", "bakery": "Padaria", "pharmacy": "Farmácia",
    "grocery_or_supermarket": "Supermercado", "cafe": "Café",
    "electrician": "Electricista", "plumber": "Canalizador",
    "beauty_salon": "Salão de Beleza", "clothing_store": "Loja de Roupa",
    "shoe_store": "Sapataria", "florist": "Florista",
    "jewelry_store": "Joalharia", "laundry": "Lavandaria",
    "locksmith": "Serralheiro", "pet_store": "Loja de Animais",
    "real_estate_agency": "Imobiliária", "gym": "Ginásio",
    "veterinary_care": "Veterinário", "dentist": "Dentista",
    "physiotherapist": "Fisioterapeuta", "lawyer": "Advogado",
    "accounting": "Contabilista",
}


def buscar_negocios(api_key: str, quantidade: int = 60) -> list[dict]:
    """
    Pesquisa negócios no Google Maps Places API.
    """
    import random
    resultados = []
    vistos = set()

    regioes = REGIOES_PT.copy()
    random.shuffle(regioes)
    tipos = TIPOS_NEGOCIO.copy()
    random.shuffle(tipos)

    for regiao in regioes:
        if len(resultados) >= quantidade:
            break
        for tipo in tipos[:6]:
            if len(resultados) >= quantidade:
                break
            try:
                places = _nearby_search(api_key, regiao["lat"], regiao["lng"], tipo)
                for place in places:
                    place_id = place.get("place_id")
                    if place_id in vistos:
                        continue
                    vistos.add(place_id)

                    detalhes = _get_details(api_key, place_id)
                    if not detalhes:
                        continue

                    telefone = detalhes.get("formatted_phone_number", "")
                    website = detalhes.get("website", "")
                    nome = detalhes.get("name", "")

                    if not telefone:
                        continue

                    check = verificar_website(website)
                    if check["qualidade"] == "bom":
                        continue

                    resultados.append({
                        "nome": nome,
                        "telefone": _limpar_telefone(telefone),
                        "website": website or "Sem website",
                        "endereco": detalhes.get("formatted_address", ""),
                        "regiao": regiao["nome"],
                        "categoria": TRADUCOES.get(tipo, tipo.replace("_", " ").title()),
                        "estado_website": check["qualidade"],
                        "motivo": check["motivo"],
                        "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}",
                    })
                    logger.info(f"Encontrado: {nome} ({regiao['nome']}) — {check['qualidade']}")

                time.sleep(0.3)

            except Exception as e:
                logger.warning(f"Erro em {regiao['nome']} / {tipo}: {e}")
                time.sleep(2)

    return resultados


def _nearby_search(api_key: str, lat: float, lng: float, tipo: str) -> list:
    params = {
        "location": f"{lat},{lng}",
        "radius": 5000,
        "type": tipo,
        "language": "pt",
        "key": api_key,
    }
    resp = requests.get(PLACES_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    status = data.get("status")
    if status not in ("OK", "ZERO_RESULTS"):
        raise Exception(f"API error: {status} — {data.get('error_message', '')}")
    return data.get("results", [])


def _get_details(api_key: str, place_id: str) -> dict | None:
    params = {
        "place_id": place_id,
        "fields": "name,formatted_phone_number,website,formatted_address",
        "language": "pt",
        "key": api_key,
    }
    try:
        resp = requests.get(DETAILS_URL, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json().get("result", {})
    except Exception as e:
        logger.debug(f"Erro detalhes {place_id}: {e}")
        return None


def _limpar_telefone(telefone: str) -> str:
    import re
    digitos = re.sub(r"\D", "", telefone)
    if not digitos.startswith("351"):
        digitos = "351" + digitos
    return "+" + digitos
