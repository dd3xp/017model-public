// Module for creating a cherry shape
module cherry(diameter=10, stem_height=15) {
    // Cherry body (sphere)
    sphere(d=diameter);
    
    // Cherry stem (cylinder)
    translate([0, 0, diameter/2])
    rotate([0, 15, 0])
    cylinder(h=stem_height, d=diameter/8, $fn=20);
}

// Module for two connected cherries
module two_cherries(
    cherry_diameter=10,
    stem_height=15,
    distance=15
) {
    // First cherry
    translate([-distance/2, 0, 0])
    cherry(cherry_diameter, stem_height);
    
    // Second cherry
    translate([distance/2, 0, 0])
    cherry(cherry_diameter, stem_height);
    
    // Connecting stem between cherries
    rotate([0, 90, 0])
    cylinder(h=distance, d=cherry_diameter/8, center=true, $fn=20);
}

// Create two connected cherries
two_cherries();