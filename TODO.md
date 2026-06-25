http://localhost:5173/?settings=eyJ2IjoyLCJpdGVtcyI6W3sidHlwZSI6InNvdXJjZSIsImNsYXNzTmFtZSI6IkJhY2tncm91bmRTb3VyY2UiLCJwYXJhbXMiOnsiYmdDb2xvciI6IiMwMDAwMDAifX0seyJ0eXBlIjoic291cmNlIiwiY2xhc3NOYW1lIjoiTGVuaWFTb3VyY2UiLCJwYXJhbXMiOnsicHJlc2V0Ijoib3JiaXVtIiwiaW5pdE1vZGUiOiJyaW5ncyIsImdyaWRSZXNvbHV0aW9uIjo1MTIsInNwZWVkIjowLjU1NSwia2VybmVsUmFkaXVzIjo3LCJtdSI6MC4xMTksInNpZ21hIjowLjAxNiwiZHQiOjAuMSwicGFsZXR0ZSI6ImNvb2wifX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiQ2hyb21hdGljQWJlcnJhdGlvbkVmZmVjdCIsInBhcmFtcyI6eyJjaHJvbWF0aWNNb2RlIjoic291cmNlIiwiY2hyb21hdGljV2lkdGgiOjAuNTUsImNocm9tYXRpY09mZnNldCI6MS42Mn19LHsidHlwZSI6ImVmZmVjdCIsImNsYXNzTmFtZSI6IkdyYWluRWZmZWN0IiwicGFyYW1zIjp7ImdyYWluQW1vdW50Ijo2fX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiQ1JURWZmZWN0IiwicGFyYW1zIjp7ImNydCI6MC43MywiY3J0U2NhbmxpbmVzIjowLjYsImNydFNjYW5saW5lc1NpemUiOjIsImNydEZsaWNrZXIiOjAuNzUsImNydFZpZ25ldHRlIjowLjAyNCwiY3J0UGhvc3Bob3JlIjowLjQ5fX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiR2xvd0VmZmVjdCIsInBhcmFtcyI6eyJnbG93IjoxLjQxLCJnbG93R3JhaW5SZXNwb25zZSI6MX19LHsidHlwZSI6ImVmZmVjdCIsImNsYXNzTmFtZSI6IkRyZWFteUdsb3dFZmZlY3QiLCJwYXJhbXMiOnsiZHJlYW15R2xvdyI6MS4wOSwiZHJlYW15R3JhaW5SZXNwb25zZSI6MSwiZHJlYW15RWRnZUJvb3N0IjowfX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiUGl4ZWxTb3J0RWZmZWN0IiwicGFyYW1zIjp7ImhHbGl0Y2giOjAuMDUsImhHbGl0Y2hTcGVlZCI6NiwiaEdsaXRjaFNjYWxlIjo4fX1dfQ%3D%3D

- Particules => Perles
- stabiliser Lenia :
  - ajouter des créatures de temps à autre
  - ce serait bien d'avoir de la décroissance dans les autres patterns ou alors de l'interpolation vers un autre seed
- sauvegarder le seed en URL à l'init et au reseed
- trouver d'autres algos
  - Fredkin
  - Evoloops
  - Larger-than-Life
  - SmoothLife
- bouger la toolbar en bas mais garder le fullscreen au même endroit
- comment mettre en place la sauvegarde mp4 ? (ou autre flux); j'imagine que des libs font déjà ça
- ajouter des automations sur les effets
- réagir au son : pulsation sur intensité du bloom, luminosité globale, taille des particules, rapidité de déplacement

- réponse au grain dans Halo ne fonctionne pas
- CRT => corriger le phosphore qui doit avoir un fondu sur les précédents pixels
- Teinte 2 s'applique sur toutes les sources alors qu'il ne faut pas que ça s'applique sur le Fond; avec Teinte 1 ça plante
- ghosts ne fonctionne pas après certains filtres (mets en place les filtres habituels)
- si on met Teinte 2 par dessus Teinte 3 ça ne fait que renforcer Teinte 3 (et idem dans l'autre sens, ça ne fait que renforcer la pemière Teinte)
- bien séparer les effets au niveau fichiers

- modes de fusion ?
- nouvelles sources :
  - bandes horizontales/verticales
  - https://vincentgarreau.com/particles.js/
  - figures géométriques ?
- effets
  - incurver l'image comme sur un écran (ou l'inverse)
  - dithering random
  - pixellisation
  - pixel desert
  - trails
- particules
  - nouveau déplacement : https://www.youtube.com/watch?v=f6rK8ZAag9E&list=PL17dHu1NtlTPkxvhcagKgEB9IGeoHz5w6&index=106


Source : shader isf
Video pong
Automation audio : par bande
Datamosh
Emulateur nes + glitch
Automation : lfo
