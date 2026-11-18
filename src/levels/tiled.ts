/**
 * Tipos mínimos do formato JSON do Tiled (https://doc.mapeditor.org/en/stable/reference/json-map-format/)
 * e utilitários puros para ler propriedades de objetos.
 */

export type TiledPropType = 'string' | 'int' | 'float' | 'bool';

export interface TiledProperty {
  name: string;
  type: TiledPropType;
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0;
  visible: true;
  properties?: TiledProperty[];
}

export interface TiledTileLayer {
  id: number;
  name: string;
  type: 'tilelayer';
  width: number;
  height: number;
  x: 0;
  y: 0;
  opacity: 1;
  visible: true;
  data: number[];
}

export interface TiledObjectLayer {
  id: number;
  name: string;
  type: 'objectgroup';
  draworder: 'topdown';
  x: 0;
  y: 0;
  opacity: 1;
  visible: true;
  objects: TiledObject[];
}

export interface TiledTileset {
  firstgid: number;
  name: string;
  image: string;
  imagewidth: number;
  imageheight: number;
  tilewidth: number;
  tileheight: number;
  columns: number;
  tilecount: number;
  margin: 0;
  spacing: 0;
}

export interface TiledMap {
  type: 'map';
  version: string;
  tiledversion: string;
  orientation: 'orthogonal';
  renderorder: 'right-down';
  infinite: false;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  nextlayerid: number;
  nextobjectid: number;
  layers: [TiledTileLayer, TiledObjectLayer];
  tilesets: TiledTileset[];
  properties: TiledProperty[];
}

/** Tipos de objeto que o gerenciador de fases entende. */
export type LevelObjectType = 'spawn' | 'checkpoint' | 'box' | 'moving_platform' | 'challenge' | 'mechanism' | 'sign' | 'assist' | 'goal' | 'crystal';

/** Lê uma propriedade customizada de um objeto Tiled com valor padrão tipado. */
type Widen<T> = T extends string ? string : T extends number ? number : boolean;

export function getProp<T extends string | number | boolean>(
  obj: { properties?: { name: string; value: unknown }[] | undefined },
  name: string,
  fallback: T,
): Widen<T> {
  const p = obj.properties?.find((x) => x.name === name);
  return (p !== undefined && typeof p.value === typeof fallback ? p.value : fallback) as Widen<T>;
}
