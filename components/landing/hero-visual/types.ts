export interface LayerProps {
  /** Per-instance id prefix so SVG defs don't collide across variants. */
  uid: string;
  /** SVG viewBox for the layer; every layer of one instance shares it. */
  viewBox: string;
}
