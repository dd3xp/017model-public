module trunk() {
    // Create the tree trunk (cylinder)
    cylinder(h=200, d=30, center=false);
}

module canopy() {
    // Create the tree canopy (sphere)
    translate([0, 0, 200]) {
        sphere(d=150);
    }
}

module oak_tree() {
    // Combine trunk and canopy to form the tree
    trunk();
    canopy();
}

// Render the complete oak tree
oak_tree();