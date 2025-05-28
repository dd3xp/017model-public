module cherry(diameter) {
    sphere(d=diameter);
}

module stem(length, diameter) {
    cylinder(h=length, d=diameter);
}

module connected_cherries() {
    cherry_diameter = 20;
    stem_length = 30;
    stem_diameter = 2;
    stem_angle = 180;
    
    // First cherry and stem
    translate([0, 0, stem_length]) {
        cherry(cherry_diameter);
    }
    stem(stem_length, stem_diameter);
    
    // Second cherry and stem
    rotate([0, 0, stem_angle]) {
        translate([0, 0, stem_length]) {
            cherry(cherry_diameter);
        }
        stem(stem_length, stem_diameter);
    }
}

connected_cherries();