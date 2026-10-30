// Kind registry. Each kind module default-exports { front(ctx, spec), alt(ctx, spec), detail(ctx, spec), styled?, finishOpts? }.
import dress from './dress.mjs';
import tee from './tee.mjs';
import shirt from './shirt.mjs';
import top from './top.mjs';
import kurta from './kurta.mjs';
import jacket from './jacket.mjs';
import trousers from './trousers.mjs';
import skirt from './skirt.mjs';
import vase from './vase.mjs';
import cushion from './cushion.mjs';
import bag from './bag.mjs';
import sneaker from './sneaker.mjs';
import heel from './heel.mjs';
import earrings from './earrings.mjs';
import saree from './saree.mjs';

const KINDS = { dress, tee, shirt, top, kurta, jacket, trousers, skirt, vase, cushion, bag, sneaker, heel, earrings, saree };
export function getKind(name) {
  const k = KINDS[name];
  if (!k) throw new Error(`unknown kind "${name}" (have: ${Object.keys(KINDS).join(', ')})`);
  return k;
}
export const kindNames = () => Object.keys(KINDS);
