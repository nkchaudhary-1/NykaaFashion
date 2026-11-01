# Image prompt pack 2: the 130 product photos

The pictures on every product card and product page. One photo per product, in the product's **first colour**: the site cuts the front view, the close-up and the detail view of each product page from that one photo. Every prompt is built from the product's own name, fabric, fit and colour, so the picture matches the listing. File names are the product ids, so the finished set drops straight in.

## How to use it

1. Same routine as the first pack: most realistic photo model, aspect ratio **4:5**, size 2048 x 2560 px or the biggest the site offers (upscale if smaller).
2. **Match the look of the first 60.** If the site has a *style reference* or *image reference* feature, give it one picture from the first set. Use the same model and settings for all 130, so the shop looks like one shop.
3. Paste the product's prompt (the look is inside it). Paste the negative prompt below if there is a negative-prompt box.
4. Make 3 or 4 versions and keep the best. Save as JPG or PNG **named with the product id** (for example `twd-01.jpg`).
5. Send them in batches as you finish each section. I check each batch against its product and tell you which to redo.

`image-prompts-products.csv` has the same 130 rows (file name, section, product, colour, ratio, size, negative prompt, prompt).

## What is in the 130, and a good order

| Order | Section | Photos | Kind of picture |
|---|---|---|---|
| 1 | Women · Dresses | 11 | model, full length |
| 2 | Women · Indian wear | 15 | model, full length (sets, kurtas, sarees) |
| 3 | Women · Tops and tees | 6 | model, full length |
| 4 | Women · Trousers and skirts | 8 | model, full length |
| 5 | Women · Knitwear | 5 | model, full length |
| 6 | Women · Jackets | 3 | model, full length |
| 7 | Women · Footwear | 5 | the pair, product shot |
| 8 | Women · Bags | 6 | product shot |
| 9 | Women · Jewellery | 10 | product shot |
| 10 | Men | 21 | model (clothes) or product shot (shoes) |
| 11 | Kids | 8 | flat lay (no children in any picture) |
| 12 | Home | 14 | product shot |
| 13 | New & Next: Vrisa | 6 | model, product shot |
| 14 | New & Next: Halden & Co. | 6 | model, product shot |
| 15 | New & Next: Kiln & Linen | 6 | product shot |
| | **Total** | **130** | |

Start with sections 1 and 2 (dresses and Indian wear, 26 photos): they are the most visible products, on the home page, in stories and in the feed. The New & Next pieces (18) belong to the brand pages you already have pictures for, so they can go last.

## The look (already inside every prompt)

**Clothes on a person**

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame.
```

**Shoes, bags, jewellery and home**

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame.
```

**Kids' clothes (flat lay, no child in the picture)**

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame.
```

**Negative prompt**

```
text, lettering, logo, brand name, label, tag text, watermark, signature, caption, border, frame, collage, split screen, cartoon, illustration, 3D render, plastic skin, airbrushed skin, deformed hands, extra fingers, extra limbs, distorted face, cropped head, cropped feet, celebrity likeness, harsh flash, HDR, oversaturated colours, lens flare, motion blur, busy background, props
```

## Reject a picture if

- any readable text, logo, brand name or label appears;
- the garment is not the one in the brief: wrong length, wrong sleeves, a dress that came out as a kurta, a saree without the pallu over the left shoulder;
- the colour is clearly different from the colour named (the colour name is in the heading of each shot);
- anything is cut by the frame: a head, a hand, a foot, the hem, half of a bag;
- hands have the wrong number of fingers, or the skin looks plastic;
- there is a prop or a busy background (the pictures sit in a grid, so they must be plain and alike);
- a child appears in a kids' picture (they are garments only).

## Notes

- **Colours.** Each product has 1 to 3 colours; this set covers the first one. The other 103 colour looks are an optional later set: until then the colour swatches change the label, not the picture.
- **Sarees and Indian wear** are never mirrored by the site (the drape would flip), so keep the pallu over the left shoulder.
- **Disclosure, rights and the private repository** are the same as in the first pack (docs/IMAGE_PROMPTS.md).

## Women · Dresses

### `twd-01` · Poppy Smocked Midi Dress · Madder

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Poppy Smocked Midi Dress (Cotton poplin; fit-and-flare with a smocked bodice; midi length, short sleeves, a V neckline) in Madder (red tone) with a floral print, with simple flat sandals. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `twd-02` · Linen Shirt Dress · Sand

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Linen Shirt Dress (Washed linen; relaxed, belted at the waist; midi length, long sleeves, a collar) in Sand (beige tone), with simple flat sandals. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `twd-03` · Tiered Voile Maxi Dress · Indigo stripe

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Tiered Voile Maxi Dress (Cotton voile; relaxed, tiered skirt; maxi length, cap sleeves, a round neckline) in Indigo stripe (blue tone) with stripes, with simple flat sandals. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `twd-04` · Bias-Cut Satin Slip Dress · Mulberry

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Bias-Cut Satin Slip Dress (Recycled satin; fluid, cut on the bias; midi length, sleeveless, a scoop neckline) in Mulberry (purple tone), with simple flat sandals. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `twd-05` · Gingham Wrap Mini · Teal check

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Gingham Wrap Mini (Cotton gingham; wrap, adjustable tie; mini length, short sleeves, a V neckline) in Teal check (blue tone) with a gingham check, with simple flat sandals. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `twd-06` · Puff-Sleeve Polka Midi · Bottle green

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Puff-Sleeve Polka Midi (Crepe; a-line, structured sleeve; midi length, puff sleeves, a square neckline) in Bottle green (green tone) with polka dots, with simple flat sandals. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `twd-07` · Rib-Knit Bodycon Midi · Charcoal

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Rib-Knit Bodycon Midi (Viscose rib knit; close-fitting, stretch; midi length, long sleeves, a round neckline) in Charcoal (black tone), with simple flat sandals. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `rsv-01` · Sequin Slip Mini · Antique gold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Sequin Slip Mini (Sequinned mesh; slim, fully lined; mini length, sleeveless, a V neckline) in Antique gold (gold tone) with sequins, with simple flat sandals. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `rsv-03` · Ruched Satin Evening Gown · Emerald

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Ruched Satin Evening Gown (Duchess satin; fitted bodice, sweeping skirt; maxi length, sleeveless, a halter neckline) in Emerald (green tone), with simple flat sandals. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `ind-02` · Indigo Tie-Dye Maxi Dress · Indigo tie-dye

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Indigo Tie-Dye Maxi Dress (Cotton voile, indigo-dyed; relaxed, tiered; maxi length, sleeveless, a square neckline) in Indigo tie-dye (blue tone) with an abstract print, with simple flat sandals. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `mau-01` · Silk Charmeuse Slip Dress · Bordeaux

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Silk Charmeuse Slip Dress (Heavy silk charmeuse; bias-cut, fluid; midi length, sleeveless, a V neckline) in Bordeaux (red tone), with simple flat sandals. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

## Women · Indian wear

### `lik-01` · Chanderi Straight Kurta Set · Blush

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Chanderi Straight Kurta Set (Chanderi silk-cotton; straight, with palazzo and dupatta) in Blush (pink tone), worn as the complete set with palazzo trousers with the dupatta draped over one shoulder, and simple juttis. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `lik-02` · Flared Kurta with Gota Trim · Marigold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Flared Kurta with Gota Trim (Cotton mul; flared, below-knee) in Marigold (yellow tone), with plain ivory churidar trousers and simple juttis. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `lik-03` · Angrakha Kurta Set · Mulberry

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Angrakha Kurta Set (Cotton silk; angrakha, with churidar) in Mulberry (purple tone) with a block-print pattern, worn as the complete set with churidar trousers with the dupatta draped over one shoulder, and simple juttis. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `lik-04` · Mulmul Printed Kurta with Palazzo · Poppy

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Mulmul Printed Kurta with Palazzo (Cotton mulmul; straight, with wide palazzo) in Poppy (orange tone) with a floral print, worn as the complete set with palazzo trousers with the dupatta draped over one shoulder, and simple juttis. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `lik-05` · Embroidered Festive Kurta Set · Ruby

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Embroidered Festive Kurta Set (Georgette with resham embroidery; straight, with pant and dupatta) in Ruby (red tone) with embroidery, worn as the complete set with pant trousers with the dupatta draped over one shoulder, and simple juttis. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `aja-01` · Ajrakh Block-Print Kurta · Indigo & madder

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Ajrakh Block-Print Kurta (Hand block-printed cotton; straight, side slits) in Indigo & madder (blue tone) with a block-print pattern, with plain ivory churidar trousers and simple juttis. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `aja-02` · Madder-Dyed Kurta Set · Madder

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Madder-Dyed Kurta Set (Madder-dyed cotton; straight kurta, pant and dupatta) in Madder (red tone) with a block-print pattern, worn as the complete set with pant trousers with the dupatta draped over one shoulder, and simple juttis. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `maa-01` · Jamdani-Weave Cotton Saree · Ivory & ink

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Jamdani-Weave Cotton Saree (Handwoven cotton jamdani; 6.3 m with unstitched blouse piece) in Ivory & ink (white tone) with an ikat pattern, draped in the classic Nivi style with the pallu falling over the left shoulder, a matching plain blouse, the pleats neat at the front and the whole saree visible. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `maa-02` · Handloom Tussar Silk Saree · Mustard

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Handloom Tussar Silk Saree (Hand-reeled tussar silk; 6.3 m with unstitched blouse piece) in Mustard (yellow tone) with a block-print pattern, draped in the classic Nivi style with the pallu falling over the left shoulder, a matching plain blouse, the pleats neat at the front and the whole saree visible. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `maa-03` · Ikat Cotton Saree · Indigo

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Ikat Cotton Saree (Handwoven ikat cotton; 6.3 m with blouse piece) in Indigo (blue tone) with an ikat pattern, draped in the classic Nivi style with the pallu falling over the left shoulder, a matching plain blouse, the pleats neat at the front and the whole saree visible. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `maa-04` · Khadi Cotton Saree · Rust

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Khadi Cotton Saree (Hand-spun khadi; 6.3 m with blouse piece) in Rust (brown tone) with stripes, draped in the classic Nivi style with the pallu falling over the left shoulder, a matching plain blouse, the pleats neat at the front and the whole saree visible. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `kor-01` · Chikankari Georgette Kurta Set · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Chikankari Georgette Kurta Set (Georgette with hand chikankari; straight kurta, pant and dupatta) in Ivory (white tone) with embroidery, worn as the complete set with pant trousers with the dupatta draped over one shoulder, and simple juttis. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `til-01` · Zari Brocade Kurta Set · Maroon & gold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Zari Brocade Kurta Set (Banarasi brocade, real zari; straight, with churidar and dupatta) in Maroon & gold (red tone) with a tonal jacquard weave, worn as the complete set with churidar trousers with the dupatta draped over one shoulder, and simple juttis. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `noo-01` · Hand-Embroidered Silk Saree · Ivory & gold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Hand-Embroidered Silk Saree (Silk organza, zardozi & resham; 6.3 m with blouse piece) in Ivory & gold (white tone) with embroidery, draped in the classic Nivi style with the pallu falling over the left shoulder, a matching plain blouse, the pleats neat at the front and the whole saree visible. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `noo-02` · Zardozi Kurta Set · Midnight & gold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Zardozi Kurta Set (Raw silk, zardozi embroidery; straight, with churidar and dupatta) in Midnight & gold (blue tone) with embroidery, worn as the complete set with churidar trousers with the dupatta draped over one shoulder, and simple juttis. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

## Women · Tops and tees

### `rsv-02` · Satin Corset Top · Wine

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Satin Corset Top (Stretch satin; boned, fitted) in Wine (red tone), with plain light-wash jeans. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `nyk-01` · Cloud Rib Lounge Tee · Oat

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Cloud Rib Lounge Tee (Modal rib; relaxed, drop shoulder) in Oat (beige tone), with plain ivory wide-leg trousers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `nyk-04` · Satin Sleep Shirt · Champagne

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Satin Sleep Shirt (Recycled satin; relaxed, piped trim) in Champagne (beige tone), with plain ivory wide-leg trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `kor-02` · Chikankari Cotton Top · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Chikankari Cotton Top (Cotton with hand chikankari; relaxed, short) in Ivory (white tone) with embroidery, with plain ivory wide-leg trousers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `jun-02` · Poplin Tie-Neck Blouse · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Poplin Tie-Neck Blouse (Cotton poplin; relaxed, tie neck) in Ivory (white tone), tucked into plain tailored stone trousers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `jun-04` · Rib-Knit Tank · White

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Rib-Knit Tank (Stretch cotton rib; fitted, scoop neck) in White (white tone), with plain light-wash jeans. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

## Women · Trousers and skirts

### `nyk-02` · Wide-Leg Modal Lounge Trousers · Oat

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Wide-Leg Modal Lounge Trousers (Modal jersey; wide-leg, drawstring waist) in Oat (beige tone), with a plain white fitted tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `aja-03` · Ajrakh Wrap Skirt · Indigo & madder

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Ajrakh Wrap Skirt (Hand block-printed cotton; wrap, midi) in Indigo & madder (blue tone) with a block-print pattern, with a plain white fitted tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `mau-03` · Pleated Silk Midi Skirt · Olive

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Pleated Silk Midi Skirt (Silk crepe de chine; knife-pleated, midi) in Olive (green tone), with a plain white fitted tee tucked in and simple white sneakers. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `jun-01` · Fluid Wide-Leg Trousers · Black

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Fluid Wide-Leg Trousers (Viscose crepe; high-rise, wide leg) in Black (black tone), with a plain white fitted tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `jun-03` · Pleated Midi Skirt · Sage

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Pleated Midi Skirt (Recycled polyester georgette; knife-pleated, midi) in Sage (green tone), with a plain white fitted tee tucked in and simple white sneakers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `jun-05` · Tailored Straight Trousers · Navy

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Tailored Straight Trousers (Stretch twill; mid-rise, straight) in Navy (blue tone), with a plain white fitted tee tucked in and simple white sneakers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `hav-01` · High-Rise Straight Jeans · Mid blue

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the High-Rise Straight Jeans (Rigid cotton denim; high-rise, straight leg) in Mid blue (blue tone), with a plain white fitted tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `hav-02` · Wide-Leg Jeans · Light wash

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Wide-Leg Jeans (Cotton-lyocell denim; high-rise, wide leg) in Light wash (blue tone), with a plain white fitted tee tucked in and simple white sneakers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

## Women · Knitwear

### `nyk-03` · Waffle-Knit Cardigan · Stone

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Waffle-Knit Cardigan (Cotton waffle knit; relaxed, longline) in Stone (beige tone), over a plain white tee with plain stone trousers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `loo-04` · Recycled-Cotton Cardigan · Oat

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Recycled-Cotton Cardigan (Recycled cotton knit; relaxed, longline) in Oat (beige tone), over a plain white tee with plain stone trousers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `mir-01` · Merino Crew Sweater · Camel

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Merino Crew Sweater (100% extra-fine merino; regular, ribbed trims) in Camel (brown tone), with plain stone trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `mir-02` · Cable-Knit Cardigan · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Cable-Knit Cardigan (Cotton-wool cable knit; relaxed, button front) in Ivory (white tone), over a plain white tee with plain stone trousers. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `mir-03` · Rib Turtleneck · Black

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Rib Turtleneck (Merino-cotton rib; fitted, high neck) in Black (black tone), with plain stone trousers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

## Women · Jackets

### `mau-02` · Tailored Wool Blazer · Charcoal

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Tailored Wool Blazer (Italian wool-mohair; tailored, single-breasted) in Charcoal (grey tone), over a plain white tee and plain stone trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `noo-03` · Embroidered Velvet Jacket · Bottle green

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Embroidered Velvet Jacket (Silk velvet, resham embroidery; cropped, relaxed shoulder) in Bottle green (green tone) with embroidery, over a plain white tee and plain stone trousers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `hav-03` · Cropped Denim Jacket · Indigo

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Cropped Denim Jacket (Cotton denim; cropped, boxy) in Indigo (blue tone), over a plain white tee and plain stone trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

## Women · Footwear

### `rsv-04` · Block-Heel Satin Sandals · Champagne

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Block-Heel Satin Sandals (Satin upper, leather sole; true to size · 7.5 cm heel) in Champagne (beige tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `ves-02` · Calf-Leather Chelsea Boot · Black

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Calf-Leather Chelsea Boot (Italian calf leather; true to size · 3 cm heel) in Black (black tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `ves-04` · Sculpted Leather Mule · Bone

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Sculpted Leather Mule (Nappa leather; true to size · 6 cm heel) in Bone (white tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `str-01` · Court Low Sneaker · White

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Court Low Sneaker (Leather-look upper, rubber sole; true to size) in White (white tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `str-03` · Chunky Platform Sneaker · White

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Chunky Platform Sneaker (Leather-look upper, EVA sole; true to size · 4 cm platform) in White (white tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

## Women · Bags

### `rsv-05` · Beaded Potli Bag · Wine

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Beaded Potli Bag (Satin, glass-bead embellishment; holds a phone, cards and lipstick) in Wine (red tone), standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

### `pip-03` · Structured Top-Handle Bag · Caramel

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Structured Top-Handle Bag (Vegan leather, gold-tone hardware; 28 × 20 × 11 cm · detachable strap) in Caramel (brown tone), standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

### `gaj-04` · Mirror-Work Potli · Marigold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Mirror-Work Potli (Cotton silk with mirror-work; drawstring · 18 cm) in Marigold (yellow tone) with mirror-work, standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

### `til-03` · Brocade Potli · Maroon

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Brocade Potli (Banarasi brocade; drawstring · 20 cm) in Maroon (red tone) with a tonal jacquard weave, standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

### `ves-01` · Pebbled Leather Tote · Cognac

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Pebbled Leather Tote (Vegetable-tanned pebbled leather; 38 × 30 × 14 cm) in Cognac (brown tone), standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

### `ves-03` · Burnished Leather Sling · Oxblood

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Burnished Leather Sling (Vegetable-tanned leather; 24 × 16 × 7 cm) in Oxblood (red tone), standing upright and seen from a three-quarter angle, the strap or handles arranged neatly. Vertical 4:5 frame.
```

## Women · Jewellery

### `pip-01` · Freshwater Pearl Drops · Pearl & gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Freshwater Pearl Drops (Freshwater pearl, gold-plated brass; lightweight · 4 cm drop) in Pearl & gold (white tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

### `pip-02` · Layered Gold-Tone Chain · Gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Layered Gold-Tone Chain (Gold-plated brass, anti-tarnish; adjustable 40–46 cm) in Gold (gold tone), laid out in a soft curve on plain cream linen, the whole piece visible and centred. Vertical 4:5 frame.
```

### `pip-04` · Sculpted Gold Hoops · Gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Sculpted Gold Hoops (Gold-plated brass; medium · 4.5 cm) in Gold (gold tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

### `gaj-01` · Kundan Jhumkas · Ruby & gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Kundan Jhumkas (Kundan, gold-plated brass, glass beads; statement · 7 cm drop) in Ruby & gold (red tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

### `gaj-02` · Meenakari Bangle Stack · Peacock

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Meenakari Bangle Stack (Brass, hand-painted meenakari enamel; set of 6 · 2.4 / 2.6 inner dia.) in Peacock (blue tone), all 6 bangles stacked and slightly fanned out on a plain cream surface. Vertical 4:5 frame.
```

### `gaj-03` · Temple Choker · Antique gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Temple Choker (Gold-plated brass, ruby-toned stones; choker · adjustable cord) in Antique gold (gold tone), laid out in a soft curve on plain cream linen, the whole piece visible and centred. Vertical 4:5 frame.
```

### `saa-01` · Oxidised Silver Jhumkas · Oxidised silver

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Oxidised Silver Jhumkas (Oxidised 92.5 sterling silver; 5.5 cm drop) in Oxidised silver (silver tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

### `saa-02` · Silver Kada Pair · Oxidised silver

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Silver Kada Pair (Oxidised 92.5 sterling silver; pair · 2.6 inner dia.) in Oxidised silver (silver tone), all 2 bangles stacked and slightly fanned out on a plain cream surface. Vertical 4:5 frame.
```

### `saa-03` · Silver Temple Necklace · Oxidised silver

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Silver Temple Necklace (Oxidised 92.5 sterling silver; adjustable cord) in Oxidised silver (silver tone), laid out in a soft curve on plain cream linen, the whole piece visible and centred. Vertical 4:5 frame.
```

### `saa-04` · Hammered Silver Hoops · Silver

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Hammered Silver Hoops (92.5 sterling silver; medium · 3.5 cm) in Silver (silver tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

## Men

### `aja-04` · Mulmul Block-Print Shirt · Indigo

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his mid-twenties, short hair, clean-shaven, wearing the Mulmul Block-Print Shirt (Cotton mulmul, block-printed; relaxed, camp collar) in Indigo (blue tone) with a block-print pattern, tucked into plain beige chinos. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `ind-01` · Shibori Cotton Shirt · Indigo shibori

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his mid-twenties, short hair and a trimmed full beard, wearing the Shibori Cotton Shirt (Shibori-dyed cotton; regular, spread collar) in Indigo shibori (blue tone) with an abstract print, tucked into plain beige chinos. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `ind-03` · Indigo Dyed Kurta · Indigo

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early forties, short wavy hair and a light beard, wearing the Indigo Dyed Kurta (Hand-dyed cotton; straight, mandarin collar) in Indigo (blue tone), with plain white pyjama trousers and simple leather sandals. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `kor-03` · Chikankari Kurta · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his mid-twenties, short neat black hair, wearing the Chikankari Kurta (Cotton mulmul, hand chikankari; straight, mandarin collar) in Ivory (white tone) with embroidery, with plain white pyjama trousers and simple leather sandals. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `kor-04` · Mulmul Chikankari Shirt · Natural

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late thirties, short wavy hair and a light beard, wearing the Mulmul Chikankari Shirt (Cotton mulmul, hand chikankari; regular, band collar) in Natural (beige tone) with embroidery, tucked into plain beige chinos. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `til-02` · Banarasi Nehru Jacket · Ink & gold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late twenties, short hair and a trimmed full beard, wearing the Banarasi Nehru Jacket (Banarasi silk-cotton brocade; regular, sleeveless) in Ink & gold (blue tone) with a tonal jacquard weave, over a plain ivory kurta and pyjama trousers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `til-04` · Zari-Border Silk Kurta · Ivory

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early thirties, short neat black hair, wearing the Zari-Border Silk Kurta (Dupion silk with zari border; straight, full sleeve) in Ivory (white tone), with plain white pyjama trousers and simple leather sandals. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `ves-05` · Burnished Leather Loafers · Chestnut

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Burnished Leather Loafers (Calf leather, leather sole; true to size) in Chestnut (brown tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `ora-01` · Linen Suit Jacket · Stone

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late thirties, short hair and a trimmed full beard, wearing the Linen Suit Jacket (Irish linen, half-lined; soft-shouldered, unstructured) in Stone (beige tone), over a plain white tee with plain stone trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `ora-02` · Mandarin Collar Silk Shirt · Ink

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early forties, short neat black hair, wearing the Mandarin Collar Silk Shirt (Washed silk; regular, band collar) in Ink (blue tone), tucked into plain beige chinos. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `ora-03` · Pleated Wool Trousers · Charcoal

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late twenties, short wavy hair and a light beard, wearing the Pleated Wool Trousers (Tropical wool; pleated, tapered) in Charcoal (grey tone), with a plain white tee tucked in and simple white sneakers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `nor-01` · Everyday Crew Tee · White

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early thirties, short hair and a trimmed full beard, wearing the Everyday Crew Tee (Combed cotton jersey; regular) in White (white tone), with plain stone chinos. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `nor-02` · Oxford Button-Down Shirt · Sky

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his mid-twenties, short neat black hair, wearing the Oxford Button-Down Shirt (Cotton oxford; regular, button-down collar) in Sky (blue tone), tucked into plain beige chinos. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `nor-03` · Tapered Chinos · Khaki

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late thirties, short wavy hair and a light beard, wearing the Tapered Chinos (Stretch cotton twill; mid-rise, tapered) in Khaki (beige tone), with a plain white tee tucked in and simple white sneakers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `nor-04` · Camp-Collar Linen Shirt · Sand

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early forties, short hair, clean-shaven, wearing the Camp-Collar Linen Shirt (Linen-cotton blend; relaxed, camp collar) in Sand (beige tone), worn untucked over plain beige chinos. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `nor-05` · Henley Tee · Oatmeal

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late twenties, short hair and a trimmed full beard, wearing the Henley Tee (Slub cotton; regular, three-button) in Oatmeal (beige tone), with plain stone chinos. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `str-02` · Retro Runner · Grey & orange

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Retro Runner (Suede and mesh upper; true to size) in Grey & orange (grey tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `str-04` · Canvas Slip-On · Navy

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Canvas Slip-On (Organic cotton canvas; true to size) in Navy (blue tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `loo-01` · Organic Cotton Tee · Natural

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early forties, short hair and a trimmed full beard, wearing the Organic Cotton Tee (GOTS organic cotton; regular) in Natural (white tone), with plain stone chinos. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `loo-02` · Hemp-Blend Shirt · Sand

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his late twenties, short neat black hair, wearing the Hemp-Blend Shirt (Hemp-organic cotton blend; relaxed) in Sand (beige tone), worn untucked over plain beige chinos. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `loo-03` · Linen Straight Trousers · Natural

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian man in his early thirties, short wavy hair and a light beard, wearing the Linen Straight Trousers (European flax linen; straight, drawstring) in Natural (beige tone), with a plain white tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

## Kids

### `lit-01` · Smocked Cotton Dress · Marigold

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Smocked Cotton Dress in children's size (Organic cotton; relaxed, smocked bodice) in Marigold (yellow tone) with a floral print, laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-02` · Printed Kurta Set · Teal

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Printed Kurta Set in children's size (Cotton; regular, with pyjama) in Teal (blue tone) with a block-print pattern, the kurta and the matching pyjama trousers laid out together as a set, laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-03` · Graphic Tee · Tomato

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Graphic Tee in children's size (Organic cotton jersey; regular) in Tomato (red tone), laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-04` · Pleated Skirt · Blush

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Pleated Skirt in children's size (Cotton blend; elasticated waist) in Blush (pink tone), laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-05` · Cotton Shirt · Sky

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Cotton Shirt in children's size (Cotton poplin; regular) in Sky (blue tone) with a gingham check, laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-06` · Canvas Sneakers · White

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Canvas Sneakers in children's size (Canvas with rubber sole; true to size) in White (white tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

### `lit-07` · Embroidered Flared Kurta · Fuchsia

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Embroidered Flared Kurta in children's size (Cotton silk; flared, with leggings) in Fuchsia (pink tone) with embroidery, laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

### `lit-08` · Soft Jogger Trousers · Heather grey

```
Clean e-commerce flat-lay photograph for an Indian online fashion store. Shot straight down on a plain cream linen surface in soft, even natural light, true-to-life colour, crisp realistic fabric texture and stitching. The whole garment laid out neatly and centred, with generous space around it. No people, no faces, no hangers. No text, letters, logos or watermarks anywhere in the frame. The Soft Jogger Trousers in children's size (Brushed cotton fleece; relaxed, elasticated cuff) in Heather grey (grey tone), laid flat with the sleeves and legs neatly arranged. Vertical 4:5 frame.
```

## Home

### `ind-04` · Shibori Cushion Cover · Indigo

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Shibori Cushion Cover (Cotton canvas; 45 × 45 cm · concealed zip) in Indigo (blue tone) with an abstract print, a cushion standing upright against a plain off-white wall on a low pale surface. Vertical 4:5 frame.
```

### `ran-01` · Block-Print Cushion Cover, Set of 2 · Madder

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Block-Print Cushion Cover, Set of 2 (Hand block-printed cotton; 45 × 45 cm · concealed zip) in Madder (red tone) with a block-print pattern, a cushion standing upright against a plain off-white wall on a low pale surface, two covers shown, one in front of the other. Vertical 4:5 frame.
```

### `ran-02` · Jaipur Quilted Throw · Madder & ivory

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Jaipur Quilted Throw (Cotton voile, hand-quilted; 150 × 220 cm) in Madder & ivory (red tone) with a block-print pattern, folded in a neat stack with one corner draped over the top, on a plain pale surface. Vertical 4:5 frame.
```

### `ran-03` · Hand-Block Bedding Set · Indigo

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Hand-Block Bedding Set (Cotton percale; king · sheet + 2 pillow covers) in Indigo (blue tone) with a block-print pattern, folded in a neat stack with a matching pillowcase on top, on a plain pale surface. Vertical 4:5 frame.
```

### `ran-04` · Sanganer Cotton Throw · Green & ivory

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Sanganer Cotton Throw (Cotton dohar; 130 × 180 cm) in Green & ivory (green tone) with a block-print pattern, folded in a neat stack with one corner draped over the top, on a plain pale surface. Vertical 4:5 frame.
```

### `mit-01` · Khurja Ceramic Bowl Set · Oat & blue

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Khurja Ceramic Bowl Set (Stoneware, food-safe glaze; set of 4 · 14 cm) in Oat & blue (beige tone), nesting bowls and a plate arranged neatly on a plain pale surface. Vertical 4:5 frame.
```

### `mit-02` · Stoneware Bud Vase · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Stoneware Bud Vase (Stoneware; 14 cm tall) in Oat (beige tone), standing on a plain pale surface. Vertical 4:5 frame.
```

### `mit-03` · Terracotta Amphora Vase · Terracotta

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Terracotta Amphora Vase (Terracotta, wood-fired; 32 cm tall) in Terracotta (brown tone), standing on a plain pale surface, with a few dried stems in it. Vertical 4:5 frame.
```

### `mit-04` · Glazed Mug Pair · Cream & rust

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Glazed Mug Pair (Stoneware; set of 2 · 300 ml) in Cream & rust (beige tone), a pair of mugs side by side on a plain pale surface. Vertical 4:5 frame.
```

### `hea-01` · Amber Glass Soy Candle · Amber

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Amber Glass Soy Candle (Soy wax, amber glass; 220 g · 45 hr burn) in Amber (orange tone), in a glass vessel, unlit, standing on a plain pale surface. Vertical 4:5 frame.
```

### `hea-02` · Dried-Stem Bud Vase · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Dried-Stem Bud Vase (Glazed ceramic with dried stems; 34 cm tall) in Oat (beige tone), standing on a plain pale surface, with a few dried stems in it. Vertical 4:5 frame.
```

### `hea-03` · Wool-Blend Throw · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Wool-Blend Throw (Wool-cotton blend; 130 × 180 cm) in Oat (beige tone), folded in a neat stack with one corner draped over the top, on a plain pale surface. Vertical 4:5 frame.
```

### `hea-04` · Linen Cushion · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Linen Cushion (Stonewashed linen; 50 × 50 cm · concealed zip) in Oat (beige tone), a cushion standing upright against a plain off-white wall on a low pale surface. Vertical 4:5 frame.
```

### `hea-05` · Ceramic Jar Candle · Bone

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Ceramic Jar Candle (Soy wax, glazed ceramic; 260 g · 55 hr burn) in Bone (white tone), in a ceramic vessel, unlit, standing on a plain pale surface. Vertical 4:5 frame.
```

## New & Next: Vrisa

### `vri-01` · Zardozi Anarkali Set · Marigold

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Zardozi Anarkali Set (Silk chanderi with zardozi; anarkali with churidar and dupatta) in Marigold (yellow tone), worn as the complete set with the dupatta draped over one shoulder, and simple juttis. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `vri-02` · Gota-Patti Sharara Set · Madder

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Gota-Patti Sharara Set (Georgette with gota-patti; short kurta with a flared sharara) in Madder (red tone), worn as the complete set with the dupatta draped over one shoulder, and simple juttis. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `vri-03` · Banarasi Brocade Jacket Kurta · Plum

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Banarasi Brocade Jacket Kurta (Banarasi brocade, cotton silk lining; straight kurta with a cropped jacket) in Plum (purple tone), worn as the complete set with the dupatta draped over one shoulder, and simple juttis. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `vri-04` · Bandhani Silk Dupatta · Peacock

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late thirties, a sleek ponytail, wearing the Bandhani Silk Dupatta (Gajji silk, bandhani; 2.5 m · finished edges) in Peacock (green tone), draped across the shoulders over a plain ivory kurta set and falling to the knees, the whole dupatta visible. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `vri-05` · Pearl & Kundan Chandbalis · Gold

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Pearl & Kundan Chandbalis (Kundan, freshwater pearl, gold-plated brass; statement · 6.5 cm drop) in Gold (gold tone), laid on a plain cream stone surface, sharp macro detail, the whole pair visible and centred. Vertical 4:5 frame.
```

### `vri-06` · Embroidered Velvet Juttis · Madder

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Embroidered Velvet Juttis (Velvet upper with zari embroidery, cushioned insole; true to size · flat) in Madder (red tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

## New & Next: Halden & Co.

### `hal-01` · Soft-Shoulder Linen Blazer · Oat

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early twenties, a long braid over one shoulder, wearing the Soft-Shoulder Linen Blazer (Washed Irish linen, half-lined; relaxed, soft shoulder) in Oat (beige tone), over a plain white tee and plain stone trousers. Standing relaxed, facing the camera. Vertical 4:5 frame.
```

### `hal-02` · Pleated Wide-Leg Trousers · Oat

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early forties, a short bob, wearing the Pleated Wide-Leg Trousers (Linen-viscose twill; high waist, wide leg) in Oat (beige tone), with a plain white fitted tee tucked in and simple white sneakers. One hand resting in a pocket or at the side, looking at the camera. Vertical 4:5 frame.
```

### `hal-03` · Poplin Relaxed Shirt · White

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her late twenties, long straight black hair, wearing the Poplin Relaxed Shirt (Organic cotton poplin; relaxed, dropped shoulder) in White (white tone), tucked into plain tailored stone trousers. Mid-step toward the camera, looking at the camera. Vertical 4:5 frame.
```

### `hal-04` · Merino Rib Knit Vest · Cream

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her early thirties, shoulder-length wavy dark hair, wearing the Merino Rib Knit Vest (Extra-fine merino; fitted, V-neck) in Cream (white tone), over a plain white poplin shirt with plain trousers. Arms relaxed at the sides, a soft smile. Vertical 4:5 frame.
```

### `hal-05` · Tailored Wool-Blend Coat · Camel

```
Clean e-commerce fashion photograph for an Indian online fashion store. Soft, even natural light, a plain warm off-white seamless background with a soft floor shadow, true-to-life colour, crisp realistic fabric texture and stitching, shot on a full-frame camera with an 85mm lens. Full length, the whole garment clearly visible, the figure centred and filling about 88% of the frame height with a little space around. Natural, relaxed expression. No text, letters, logos or watermarks anywhere in the frame. A South Asian woman in her mid-twenties, hair in a low bun, wearing the Tailored Wool-Blend Coat (Wool-blend twill, fully lined; straight, knee length) in Camel (brown tone), over a plain white tee and plain stone trousers. One hand lightly on the hip, looking at the camera. Vertical 4:5 frame.
```

### `hal-06` · Leather Penny Loafers · Tan

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. A pair of Leather Penny Loafers (Vegetable-tanned leather, leather sole; true to size) in Tan (brown tone), the right shoe slightly in front of the left, seen from a three-quarter angle on a plain warm off-white surface. Vertical 4:5 frame.
```

## New & Next: Kiln & Linen

### `kil-01` · Bouclé Cushion Cover Set · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Bouclé Cushion Cover Set (Cotton bouclé, hidden zip; set of 2 · 45 × 45 cm) in Oat (beige tone), a cushion standing upright against a plain off-white wall on a low pale surface, two covers shown, one in front of the other. Vertical 4:5 frame.
```

### `kil-02` · Stonewashed Linen Throw · Flax

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Stonewashed Linen Throw (Stonewashed European linen; 130 × 180 cm) in Flax (beige tone), folded in a neat stack with one corner draped over the top, on a plain pale surface. Vertical 4:5 frame.
```

### `kil-03` · Hand-Thrown Stoneware Vase · Oat

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Hand-Thrown Stoneware Vase (Glazed stoneware; 24 cm tall) in Oat (beige tone), standing on a plain pale surface. Vertical 4:5 frame.
```

### `kil-04` · Beeswax Pillar Candle Trio · Honey

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Beeswax Pillar Candle Trio (Beeswax, cotton wick; set of 3 · burns 30 hours each) in Honey (yellow tone), unlit, standing on a plain pale surface. Vertical 4:5 frame.
```

### `kil-05` · Terracotta Dinner Set, 12 pc · Terracotta

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Terracotta Dinner Set, 12 pc (Glazed terracotta; serves 4 · dishwasher safe) in Terracotta (orange tone), stacked plates and bowls arranged in a neat set on a plain pale surface. Vertical 4:5 frame.
```

### `kil-06` · Washed Linen Duvet Cover · Flax

```
Clean e-commerce product photograph for an Indian online fashion and lifestyle store. Soft, even natural window light, a plain warm off-white surface and background with a soft contact shadow, true-to-life colour, crisp realistic material texture, shot on a full-frame camera with a 100mm macro lens. The whole product in frame, centred, with generous space around it. No people. No text, letters, logos, labels or watermarks anywhere in the frame. The Washed Linen Duvet Cover (Stonewashed linen; double · 220 × 240 cm) in Flax (beige tone), folded in a neat stack with a matching pillowcase on top, on a plain pale surface. Vertical 4:5 frame.
```
