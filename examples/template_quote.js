'use strict';

const structure_template = (`
<section class="title">
  <h1 id="title">{{ title }}</h1>
  <p id="date">{{ date }}</p>
</section>

<br/>

<section class="mainContent">

  <h3>Word of the Day</h3>
    <h4 id="wordOfDay">{{ wordOfDay }}</h4>
    <p id="wordofDayType"> <i>{{ wordOfDayType }}</i></p>
    <p id="wordofDayDef">Definition: {{ wordOfDayDef }}</p>
    <br/>

  <h3>Quote of the Day</h3>
    <p id="quoteText">\"{{ quoteText }}\"</p>
    <p id="quoteAuthor">-{{ quoteAuthor }}</p>
    <br/>

  <h3>This Day in History</h3>
    <p id="dayInHistoryHead">{{ dayInHistoryHead }}</p>
    <p id="dayInHistoryBody">{{ dayInHistoryBody }}</p>
    <p id="dayInHistoryYear">{{ dayInHistoryYear }}</p>
    <br/>

  <h3>Today's Holiday</h3>
    <p id="todaysHolidayHead">{{ todaysHolidayHead }}</p>
    <p id="todaysHolidayBody">{{ todaysHolidayBody }}</p>

    <br/>
    <p id="sourceURL">Source URL: {{ sourceURL }}</p>
</section>`);

exports.structure_template = structure_template;
