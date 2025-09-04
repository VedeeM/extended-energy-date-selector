# extended-energy-date-selector
## Goal
This card is an extension of the functionality of the official [Energy Date Picker Card](https://www.home-assistant.io/dashboards/energy/#energy-date-picker) from Home Assistant.
The card mimics the functions of the core Energy Date Picker, but adds extra options.
The main difference is that it can synchronize date/time helpers so you can use the date selector with other cards as well.

<details>
<summary>Why this card?</summary>
  
When I first started with Home Assistant I soon stumbled upon a problem with the core Energy Date Picker. It was not able to communicate with other cards like [ApexCharts Card](https://github.com/RomRider/apexcharts-card)
I noticed I was not alone and many people where asking for this functionality for a long time.
After fiddling around with other cards like [Energy Period Selector Plus](https://github.com/flixlix/energy-period-selector-plus) I did not find a solid solution and decided to start my own card from scratch. Building upon the idea of Energy Period Selector Plus with some coding and help of AI, I came to this solution.

</details>

## Features
- Synchronize dates to helpers (adjustable)
- Synchronize to core energy cards (adjustable)
- UI Editor
- Highly configurable
- Show/hide HA card style
## ToDo
- Make Compare work
- auto_sync_core on/of
- use local variables instead of global helpers
  
## Install
### HACS (recommended)
This card is available in HACS (Home Assistant Community Store). HACS is a third-party community store and is not included in Home Assistant out of the box.

- Install with HACS
- Add 2 date/time helpers to hold the start and end date\
  By default the Extended Energy Date Selector uses
  - input_datetime.energy_start_date
  - input_datetime.energy_end_date\
  But you can choose whatever name you like, and change the configuration accordingly

<details>
<summary>Manual Install</summary>

Save the extended-energy-date-selector.js file in the following location

    www/community/extended-energy-date-selector/extended-energy-date-selector.js
Add the file to your HA resources, by adding the following lines to your configuration.yaml file
Or in the UI Settings > dashboards > Resources

    resources:
      - url: /local/community/extended-energy-date-selector/extended-energy-date-selector.js
        type: module

</details>

## Options
|Name               |Requirement|Default                             |Description                         |Options                       |
|-------------------|-----------|------------------------------------|------------------------------------|------------------------------|
|type               |Required   |custom:extended-energy-date-selector|                                    |                              |
|title              |Optional   |No title displayed                  |Title of the card                   |true/false                    |
|card_theme         |Optional   |true                                |Show the card themed or transparant |true/false                    |
|period_buttons     |Optional   |day, week, month, year              |Show period buttons                 |day, week, month, year, custom|
|show_today_button  |Optional   |true                                |Show today button                   |true/false                    |
|today_button_type  |Optional   |icon                                |Show today button as text or icon   |icon/text                     |
|today_button_text  |Optional   |Today                               |Today button text                   |icon/text                     |
|today_button_icon  |Optional   |mdi:calendar-today                  |today button icon                   |icon/text                     |
|show_compare_button|Optional   |false                               |Show compare button                 |true/false                    |
|compare_button_type|Optional   |text                                |Show compare button as text or icon |icon/text                     |
|compare_button_text|Optional   |Compare                             |Compare button text                 |icon/text                     |
|compare_button_icon|Optional   |mdi:compare                         |Compar button icon                  |icon/text                     |
|auto_sync_core     |Optional   |true                                |Synchronize core energy graphs      |true/false                    |
|auto_sync_helpers  |Optional   |true                                |Synchronize helpers                 |true/false                    |
|prev_next_buttons  |Optional   |true                                |Show previous and next buttons      |true/false                    |
|start_date_helper  |Optional   |input_datetime.energy_start_date    |id of the start_date_helper         |                              |
|end_date_helper    |Optional   |input_datetime.energy_end_date      |id of the end_date_helper           |                              |
|debug              |Optional   |false                               |Show console debug                  |true/false                    |
## examples
### full example
This is a full example with all options.\
Some options are not used because they are deactivated by an other option\
i.e. `today_button_text` is not used when `today_button_type` is set to `icon`

    type: custom:smart-energy-date-selector
    title: My dates
    card_theme: true
    period_buttons:
      - day
      - week
      - month
      - year
      - custom
    show_today_button: true
    today_button_type: icon
    today_button_icon: mdi:calendar-today-outline
    today_button_text: Now
    show_compare_button: true
    compare_button_type: text
    compare_button_icon: mdi:compare-horizontal
    compare_button_text: Compare
    auto_sync_core: true
    auto_sync_helpers: true
    start_date_helper: input_datetime.energy_start_date
    end_date_helper: input_datetime.energy_end_date
    prev_next_buttons: true
    debug: false
### apexchart-card example
To use the date selector with ApexCharts-card, you need some aditional helpers.\
The date selector stores the start and the end date in 2 date/time helpers.\
However Apexcharts uses span and offset to create the graphs.\
So we need two more sensor template helpers that calculate those parameters.

#### needed
- [extended-energy-date-selector](https://github.com/VedeeM/extended-energy-date-selector)
- [ApexCharts-Card](https://github.com/RomRider/apexcharts-card)
- [config-template-card](https://github.com/iantrich/config-template-card)
- 2 date/time helpers
- 2 template sensor helpers

##### sensor.energy_date_offset
this generates an offset in the form of i.e. -1d counting from today
Add this to your configuration file or use the UI to add helpers

    # Example state-based configuration.yaml entry
    template:
      - sensor:
          - name: "energy_date_offset"
            state: >
              {% set start = as_timestamp(states('input_datetime.energy_start_date')) %}
              {% set today = now().replace(hour=0,minute=0,second=0,microsecond=0).timestamp() %}
              
              {% if start %}
                {% set diff_days = ((start - today) / 86400) | round(0) | int %}
                {% if diff_days == -1 %}
                  -0d
                {% else %}
                  {{ "%+d" | format(diff_days + 1) }}d
                {% endif %}
              {% else %}
                unknown
              {% endif %}

##### sensor.energy_date_span
this generates a span in the form of i.e. 3d
Add this to your configuration file or use the UI to add helpers

    # Example state-based configuration.yaml entry
    template:
      - sensor:
          - name: "energy_date_span"
            state: >
              {% set start = as_timestamp(states('input_datetime.energy_start_date')) %}
              {% set end = as_timestamp(states('input_datetime.energy_end_date')) %}
              
              {% if start and end %}
                {{ ((end - start) / 86400) | round(0) | int }}d
              {% else %}
                unknown
              {% endif %}

##### The apexchart
The template sensors cannot be used in Apexcharts directly because it does not accept any variables. (or I didn't find how to do that)\
The solution is to wrap the ApexChart in another card named [config-template-card](https://github.com/iantrich/config-template-card)\
This example brings everything together.

    type: custom:config-template-card          // Card adds the ability to use variables
    variables:
      OFFSET: states['sensor.energy_date_offset'].state
      SPAN: states['sensor.energy_date_span'].state
    entities:
      - sensor.my_energy_daily
      - sensor.energy_date_offset              // needed, otherwise the card does not update when this helper changes
      - sensor.energy_date_span                // needed, otherwise the card does not update when this helper changes
    card:
      type: custom:apexcharts-card             // the actual apexchart
      graph_span: ${SPAN}
      span:
        start: day
        offset: ${OFFSET}
      series:
        - entity: sensor.my_energy_daily
          name: energie
