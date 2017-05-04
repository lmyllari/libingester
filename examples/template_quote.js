'use strict';

const structure_template = (`
<section class="title">
  <h1>{{ title }}</h1>
  <h3>{{ date }}</h3>
</section>

<section class="mainContent">
  <h2>Free Dictionary Content</h2>
  <p>{{ wordOfDay }}</p>
  <p>{{ wordOfDayType }}</p>
</section>`);

exports.structure_template = structure_template;
