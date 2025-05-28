module spear_shaft(length=200, diameter=3) {
    // Create the spear shaft as a long cylinder
    cylinder(h=length, d=diameter, center=false);
}

module spear_head(length=25, width=5, shaft_diameter=3) {
    // Create a triangular spear head
    blade_height = length * 0.8;
    base_thickness = shaft_diameter / 2;
    
    linear_extrude(height=base_thickness, center=false) {
        polygon(points=[
            [0, 0],
            [width/2, blade_height],
            [-width/2, blade_height]
        ]);
    }
    
    // Add transition piece between shaft and head
    translate([0, 0, -shaft_diameter/2])
    cylinder(h=shaft_diameter/2, d1=shaft_diameter, d2=width/2);
}

module spear_butt(length=5, diameter=3) {
    // Create rounded butt cap
    union() {
        cylinder(h=length-1, d=diameter, center=false);
        translate([0, 0, length-1])
        sphere(d=diameter);
    }
}

module spear(
    shaft_length = 200,
    shaft_diameter = 3,
    head_length = 25,
    head_width = 5,
    butt_length = 5
) {
    // Assemble complete spear
    color("Goldenrod") spear_shaft(length=shaft_length, diameter=shaft_diameter);
    
    // Add head at top
    translate([0, 0, shaft_length])
    rotate([90, 0, 0])
    color("Silver") spear_head(
        length=head_length,
        width=head_width,
        shaft_diameter=shaft_diameter
    );
    
    // Add butt at bottom
    translate([0, 0, -butt_length])
    color("Silver") spear_butt(length=butt_length, diameter=shaft_diameter);
}

// Create the spear
spear();