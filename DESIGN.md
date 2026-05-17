---
name: InstaSpots Design System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1b1b1b'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303030'
  inverse-on-surface: '#f1f1f1'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdf'
  on-secondary-container: '#626262'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e4e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1b1b1b'
  surface-variant: '#e2e2e2'
  map-accent: '#2196F3'
  surface-elevated: '#F5F5F5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 16px
  margin-desktop: 40px
  gutter: 24px
  unit: 8px
---

# DESIGN.md — Red Social de Lugares "Instagrameables"

> **Nota:** Este documento recoge la **visión de diseño original** (producto,
> UI/UX y la arquitectura propuesta inicialmente). La arquitectura
> **realmente implementada** —API Gateway + microservicio REST + microservicio
> GraphQL sobre MongoDB Atlas con Mongoose— está documentada en
> [`README.md`](README.md). Donde ambos difieran, el README refleja el estado
> vigente del código; esta guía sigue siendo la referencia de identidad
> visual (colores, tipografía, espaciado) descrita en el front-matter.

## 1. Visión General del Proyecto

Descripción: Una aplicación web responsiva enfocada en descubrir, mapear y compartir los lugares visualmente más atractivos (cafeterías, murales, restaurantes, paisajes) de la ciudad.
Objetivo Principal: Resolver la falta de una plataforma centralizada para que los jóvenes encuentren locaciones ideales para la creación de contenido y fotografía social.
Funciones Core (MVP):

    Publicación de lugares: Subida de imágenes con metadatos descriptivos y etiquetas.

    Mapas y ubicación: Descubrimiento geoespacial interactivo de lugares cercanos.

## 2. Principios de Interfaz y Experiencia de Usuario (UI/UX)

El diseño se conceptualizará y prototipará en Figma, bajo las siguientes premisas:

    Diseño Image-First: La interfaz debe ser invisible. Las fotografías son las protagonistas. Se utilizarán márgenes limpios y esquemas de color monocromáticos (Light/Dark mode) para no competir con el contenido visual.

    Navegación Fluida: Transiciones suaves entre el mapa interactivo y la galería de imágenes, evitando recargas de página completas.

    Fricción Mínima de Publicación: El formulario para subir un nuevo lugar debe requerir solo lo esencial (Foto, Título, Ubicación) en la primera pantalla, dejando los detalles adicionales como opcionales.

## 3. Arquitectura y Stack Tecnológico

La aplicación seguirá una arquitectura cliente-servidor desacoplada, optimizada para la carga rápida de imágenes y consultas geoespaciales.

    Frontend: React

        Ruteo: React Router para la navegación SPA.

        Mapas: Integración con librerías como Leaflet o Mapbox GL JS.

        Gestión de Estado y Fetching: Cliente Apollo para manejar las consultas al servidor de manera eficiente y mantener el estado local y remoto sincronizado.

    Backend: Node.js

        API: GraphQL. Permite solicitar únicamente los datos necesarios (ej. solo coordenadas y miniatura para el mapa), reduciendo drásticamente el consumo de red.

    Base de Datos: MongoDB

        Por qué: Estructura de documentos ideal para publicaciones variables. Uso crítico de GeoJSON e índices geoespaciales (2dsphere) para realizar consultas eficientes del tipo "encuentra lugares instagrameables a 5km de mí".

## 4. Esquema de Datos (Data Models)

### Colección: Places (Lugares)

Estructura principal del documento en MongoDB para almacenar las locaciones.
JSON

{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "images": [
    {
      "url": "String",
      "altText": "String"
    }
  ],
  "location": {
    "type": "Point",
    "coordinates": ["Longitude", "Latitude"]
  },
  "tags": ["String"], // ej. ["aesthetic", "neon", "brunch"]
  "bestTimeToGo": "String", // ej. "Atardecer"
  "authorId": "ObjectId",
  "createdAt": "Date"
}

### Colección: Users (Usuarios)
JSON

{
  "_id": "ObjectId",
  "username": "String",
  "avatarUrl": "String",
  "savedPlaces": ["ObjectId"] // Para la futura función de Favoritos
}

## 5. Diseño de la API (GraphQL)

### Queries Principales

    getPlacesInBounds(northeast, southwest): Devuelve los lugares dentro de la caja de visión actual del mapa del usuario. Solicita solo ID, coordenadas y la primera foto.

    getPlaceDetails(id): Devuelve la información completa (todas las fotos, descripción, tags) cuando un usuario hace clic en un marcador o tarjeta.

Mutations Principales

    createPlace(input): Recibe la información del formulario, procesa la subida de imágenes (mediante un servicio como AWS S3 o Cloudinary) y guarda el registro con sus coordenadas en MongoDB.

## 6. Jerarquía de Componentes Frontend (React)

Estructura modularizada para garantizar componentes reutilizables:

    App (Layout principal, envolturas de contexto/Apollo)

        TopNavigation (Barra de búsqueda, botón de "Crear Publicación", Perfil)

        MainView (Contenedor dual o vista de pestañas en móvil)

            MapView

                MapContainer (Librería de mapas)

                CustomMarker (Pin en el mapa)

                PlacePopup (Mini-tarjeta al tocar un pin)

            FeedView

                PlaceCard (Tarjeta tipo feed con imagen grande y tags)

        PublishModal (Modales superpuestos)

            ImageUploader

            LocationPicker (Mapa seleccionable para soltar el pin)

            DetailsForm

        PlaceDetailsModal (Vista detallada del lugar)