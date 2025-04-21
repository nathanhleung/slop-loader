A Link button component that takes in four props "href", "target", "variant" and "children". "href" and "target" are strings passed to the underlying <a>, "variant" is "primary" | "secondary" (default "primary"), "children" is a ReactNode.

Children should be centered, if text. Text should be bold. Rounded corners with 9999px border radius. 8px y-axis and 16px x-axis padding to give the button content some space. DO NOT MIX UP TAILWIND UNITS AND PX UNITS.

"primary" variant should have black background with white text. "secondary" variant should have white background with black text.

As the default variant is "primary", when no variant is passed, the default button should have a black background with white text.

On hover, the button should have opacity 0.5 with a 0.3s transition.
