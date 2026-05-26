/**
 * Wraps the hero with Ninetailed <Experience> so different audiences
 * can see different headline / CTA / featured product.
 *
 * How it works:
 *  1. NinetailedProvider (in Layout) detects which audience the visitor is in
 *  2. <Experience> picks the matching variant from the `experiences` prop
 *  3. If no audience matches → the default baseline hero is shown
 *
 * The `experiences` prop is populated from Contentful entries that have
 * the NT Experience field added in the HomepageSettings content type.
 */
import {Experience} from '@ninetailed/experience.js-react';

/**
 * @param {object} props
 * @param {React.ComponentType} props.HeroComponent  - The baseline Hero component
 * @param {object} props.heroCms                     - Baseline CMS data
 * @param {Array}  props.experiences                 - Ninetailed experience variants
 *                                                     (empty until you create personalizations
 *                                                      in Contentful Optimization)
 */
export default function PersonalizedHero({HeroComponent, heroCms, experiences = []}) {
  return (
    <Experience
      id={heroCms?.sys?.id || 'homepage-hero'}
      passthroughProps={{cms: heroCms}}
      experiences={experiences}
      component={HeroComponent}
    />
  );
}
