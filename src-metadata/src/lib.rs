use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use ttf_parser::*;
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct VariationAxis {
    pub tag: String,
    pub min_value: f32,
    pub max_value: f32,
    pub def_value: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Font {
    pub names: HashMap<u16, String>,
    pub italic: bool,
    pub stretch: u16,
    pub weight: u16,
    pub glyph_count: u16,
    pub is_variable: bool,
    pub variation_axes: Vec<VariationAxis>,
}

type FontDefinitions = Vec<Font>;

#[wasm_bindgen]
pub fn metadata(data: Vec<u8>) -> JsValue {
    let mut fonts: FontDefinitions = vec![];

    for i in 0..fonts_in_collection(&data).unwrap_or(1) {
        if let Ok(face) = ttf_parser::Face::parse(&data, i) {
            let mut names = HashMap::new();

            for name in face.names().into_iter().filter(|name| name.is_unicode()) {
                if let Some(value) = name.to_string() {
                    names.insert(name.name_id, value);
                }
            }

            if names.is_empty() || names.get(&name_id::FAMILY) == Some(&"false".to_string()) {
                continue;
            }

            let is_variable = face.is_variable();
            let mut variation_axes = Vec::new();

            if is_variable {
                for axis in face.variation_axes() {
                    variation_axes.push(VariationAxis {
                        tag: axis.tag.to_string(),
                        min_value: axis.min_value,
                        max_value: axis.max_value,
                        def_value: axis.def_value,
                    });
                }
            }

            fonts.push(Font {
                names,
                italic: face.is_italic(),
                stretch: face.width().to_number(),
                weight: face.weight().to_number(),
                glyph_count: face.number_of_glyphs(),
                is_variable,
                variation_axes,
            });
        }
    }

    if fonts.len() == 1 {
        return serde_wasm_bindgen::to_value(&fonts[0]).unwrap();
    }

    serde_wasm_bindgen::to_value(&fonts).unwrap()
}
