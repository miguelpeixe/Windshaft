require('../support/test_helper');

var assert = require('../support/assert');
var _ = require('underscore');
var getLayerTypeFn = require('../../lib/windshaft/models/mapconfig').prototype.getType;
var TestClient = require('../support/test_client');

describe('multilayer interactivity and layers order', function() {

    function layerType(layer) {
        return layer.type || 'undefined';
    }

    function testInteractivityLayersOrderScenario(testScenario) {
        it(testScenario.desc, function(done) {
            var mapConfig =  {
                version: '1.3.0',
                layers: testScenario.layers
            };
            var testClient = new TestClient(mapConfig);
            testClient.createLayergroup(function(err, layergroup) {
                var layergroupId = layergroup.layergroupid;
                assert.ok(layergroupId);
                assert.equal(layergroup.metadata.layers.length, mapConfig.layers.length);

                // check layers metadata at least match in number
                var layersMetadata = layergroup.metadata.layers;
                assert.equal(layersMetadata.length, mapConfig.layers.length);
                for (var i = 0, len = layersMetadata.length; i < len; i++) {
                    assert.equal(
                        getLayerTypeFn(layersMetadata[i].type),
                        getLayerTypeFn(mapConfig.layers[i].type)
                    );
                }
                // check torque metadata at least match in number
                var torqueLayers = mapConfig.layers.filter(function(layer) { return layer.type === 'torque'; });
                if (torqueLayers.length) {
                    assert.equal(Object.keys(layergroup.metadata.torque).length, torqueLayers.length);
                }

                done();
            });
        });
    }

    var cartocssVersion = '2.3.0';
    var cartocss = '#layer { line-width:16; }';
    var sql = "select 1 as i, st_setsrid('LINESTRING(0 0, 1 0)'::geometry, 4326) as the_geom";
    var sqlWadus = "select 1 as wadus, st_setsrid('LINESTRING(0 0, 1 0)'::geometry, 4326) as the_geom";

    var httpLayer = {
        type: 'http',
        options: {
            urlTemplate: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
            subdomains: ['a','b','c']
        }
    };

    var torqueLayer = {
        type: 'torque',
        options: {
            sql: "select 1 id, '1970-01-02'::date d, 'POINT(0 0)'::geometry the_geom_webmercator",
            cartocss: [
                "Map {",
                    "-torque-frame-count:2;",
                    "-torque-resolution:3;",
                    "-torque-time-attribute:d;",
                    "-torque-aggregation-function:'count(id)';",
                "}"
            ].join(' '),
            cartocss_version: '2.0.1'
        }
    };

    var mapnikLayer = {
        type: 'mapnik',
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss
        }
    };

    var mapnikInteractivityLayer = {
        type: 'mapnik',
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss,
            interactivity: 'i'
        }
    };

    var cartodbLayer = {
        type: 'cartodb',
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss
        }
    };

    var cartodbInteractivityLayer = {
        type: 'cartodb',
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss,
            interactivity: 'i'
        }
    };

    var cartodbWadusInteractivityLayer = {
        type: 'cartodb',
        options: {
            sql: sqlWadus,
            cartocss_version: cartocssVersion,
            cartocss: cartocss,
            interactivity: 'wadus'
        }
    };

    var noTypeLayer = {
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss
        }
    };

    var noTypeInteractivityLayer = {
        options: {
            sql: sql,
            cartocss_version: cartocssVersion,
            cartocss: cartocss,
            interactivity: 'i'
        }
    };

    var allLayers = [
        httpLayer,
        torqueLayer,
        mapnikLayer,
        mapnikInteractivityLayer,
        cartodbLayer,
        cartodbInteractivityLayer,
        cartodbWadusInteractivityLayer,
        noTypeLayer,
        noTypeInteractivityLayer
    ];

    var testScenarios = [
        {
            desc: 'one layer, no interactivity',
            layers: [cartodbLayer]
        },
        {
            desc: 'one layer with interactivity',
            layers: [cartodbInteractivityLayer]
        },
        {
            desc: 'two layers, interactivity mix',
            layers: [
                cartodbLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'two layers, different interactivity columns',
            layers: [
                cartodbWadusInteractivityLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'mix of no interactivity with interactivity',
            layers: [
                cartodbInteractivityLayer,
                cartodbLayer,
                cartodbWadusInteractivityLayer
            ]
        },
        {
            desc: 'interactivity layers + torque',
            layers: [
                cartodbWadusInteractivityLayer,
                cartodbInteractivityLayer,
                torqueLayer
            ]
        },
        {
            desc: 'torque + interactivity layers',
            layers: [
                torqueLayer,
                cartodbWadusInteractivityLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'interactivity + torque + interactivity',
            layers: [
                cartodbInteractivityLayer,
                torqueLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'http + mix of [no] interactivity layers',
            layers: [
                httpLayer,
                cartodbInteractivityLayer,
                cartodbLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'http + interactivity + torque + interactivity',
            layers: [
                httpLayer,
                cartodbInteractivityLayer,
                torqueLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'http + interactivity + torque + no interactivity + torque + interactivity',
            layers: [
                httpLayer,
                cartodbInteractivityLayer,
                torqueLayer,
                cartodbLayer,
                torqueLayer,
                cartodbWadusInteractivityLayer
            ]
        },
        {
            desc: 'mapnik type – two layers, interactivity mix',
            layers: [
                mapnikLayer,
                mapnikInteractivityLayer
            ]
        },
        {
            desc: 'mapnik type – mix of no interactivity with interactivity',
            layers: [
                cartodbInteractivityLayer,
                cartodbLayer,
                mapnikInteractivityLayer
            ]
        },
        {
            desc: 'mapnik type – interactivity layers + torque',
            layers: [
                mapnikInteractivityLayer,
                cartodbInteractivityLayer,
                torqueLayer
            ]
        },
        {
            desc: 'mapnik type – http + interactivity + torque + interactivity',
            layers: [
                httpLayer,
                mapnikInteractivityLayer,
                torqueLayer,
                cartodbInteractivityLayer
            ]
        },
        {
            desc: 'no type – two layers, interactivity mix',
            layers: [
                noTypeLayer,
                noTypeInteractivityLayer
            ]
        },
        {
            desc: 'no type – mix of no interactivity with interactivity',
            layers: [
                noTypeInteractivityLayer,
                noTypeLayer,
                mapnikInteractivityLayer
            ]
        },
        {
            desc: 'no type – interactivity layers + torque',
            layers: [
                noTypeLayer,
                noTypeInteractivityLayer,
                torqueLayer
            ]
        },
        {
            desc: 'no type – http + interactivity + torque + interactivity',
            layers: [
                httpLayer,
                noTypeInteractivityLayer,
                torqueLayer,
                noTypeInteractivityLayer
            ]
        }
    ];

    var chaosScenariosSize = 25;
    var chaosScenarios = [];
    for (var i = 0; i < chaosScenariosSize; i++) {
        // Underscore.js' sample method uses Fisher-Yates shuffle internally, see http://bost.ocks.org/mike/shuffle/
        var randomLayers = _.sample(allLayers, _.random(1, allLayers.length));
        chaosScenarios.push({
            desc: 'chaos scenario – layer types: ' + randomLayers.map(layerType).join(', '),
            layers: randomLayers
        });
    }

    testScenarios.forEach(testInteractivityLayersOrderScenario);
    chaosScenarios.forEach(testInteractivityLayersOrderScenario);

});

