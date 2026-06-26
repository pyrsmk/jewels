- l'automation n'est pas sauvegardée
  - https://jewels.animi.st/?settings=eyJ2IjozLCJpdGVtcyI6W3sidHlwZSI6InNvdXJjZSIsImNsYXNzTmFtZSI6IkJhY2tncm91bmRTb3VyY2UiLCJwYXJhbXMiOnsiYmdDb2xvciI6IiMwMDAwMDAifX0seyJ0eXBlIjoic291cmNlIiwiY2xhc3NOYW1lIjoiR2FtZU9mTGlmZVNvdXJjZSIsInBhcmFtcyI6eyJhbGdvcml0aG0iOiJsdGxfZ2xvYmUiLCJncmlkUmVzb2x1dGlvbiI6MjU2LCJzcGVlZCI6MC40MzUsInNwYXduUmF0ZSI6MCwiaW5pdGlhbERlbnNpdHkiOjAuMTUsImluaXRNb2RlIjoibXVsdGkiLCJwYWxldHRlIjoidG94aWMiLCJzZWVkIjo3MDY0NzQ3MDgsImJvdW5kYXJ5TW9kZSI6ImNvbnRpbnVvdXMifX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiQ2hyb21hdGljQWJlcnJhdGlvbkVmZmVjdCIsInBhcmFtcyI6eyJjaHJvbWF0aWNNb2RlIjoiZWRnZXMiLCJjaHJvbWF0aWNXaWR0aCI6MC41NSwiY2hyb21hdGljT2Zmc2V0IjowLjc1fX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiR3JhaW5FZmZlY3QiLCJwYXJhbXMiOnsiZ3JhaW5BbW91bnQiOjZ9fSx7InR5cGUiOiJlZmZlY3QiLCJjbGFzc05hbWUiOiJDUlRFZmZlY3QiLCJwYXJhbXMiOnsiY3J0IjoxLCJjcnRTY2FubGluZXMiOjAuNiwiY3J0U2NhbmxpbmVzU2l6ZSI6MiwiY3J0RmxpY2tlciI6MC43LCJjcnRWaWduZXR0ZSI6MC4wMywiY3J0UGhvc3Bob3JlIjowLjN9fSx7InR5cGUiOiJlZmZlY3QiLCJjbGFzc05hbWUiOiJHbG93RWZmZWN0IiwicGFyYW1zIjp7Imdsb3ciOjEsImdsb3dHcmFpblJlc3BvbnNlIjoxfX0seyJ0eXBlIjoiZWZmZWN0IiwiY2xhc3NOYW1lIjoiRHJlYW15R2xvd0VmZmVjdCIsInBhcmFtcyI6eyJkcmVhbXlHbG93Ijo0LCJkcmVhbXlHcmFpblJlc3BvbnNlIjoxLCJkcmVhbXlFZGdlQm9vc3QiOjAuNSwiZHJlYW15SGFsb0RpciI6MTV9fV19)

- les modes s'enchainent pas ouf
- améliorer les palettes / le système de palettes
- le beat est légèrement décalé

- problème de freeze intermittent
- les sources se mélangent bizarrement

- la sidebar devient flottante (toujours calée à gauche, avec une marge par rapport aux bords de l'écran), la toolbar va en bas au centre, avec aussi le bouton fullscreen, le fps reste affiché en haut à droite (avec une marge)

- Teinte 2 s'applique sur toutes les sources alors qu'il ne faut pas que ça s'applique sur le Fond; avec Teinte 1 ça plante
- ghosts ne fonctionne pas après certains filtres (mets en place les filtres habituels)
- si on met Teinte 2 par dessus Teinte 3 ça ne fait que renforcer Teinte 3 (et idem dans l'autre sens, ça ne fait que renforcer la pemière Teinte)
- réponse au grain dans Halo ne fonctionne pas
- CRT => corriger le phosphore qui doit avoir un fondu sur les précédents pixels (ou alors on met ça dans un autre effet ?)

- bien séparer les effets au niveau fichiers

- comment mettre en place la sauvegarde mp4 ? (ou autre flux); j'imagine que des libs font déjà ça
- quand on souhaitera enregistrer, il faudra proposer de passer en fullscreen

- nouvelles sources :
  - bandes horizontales/verticales
  - https://vincentgarreau.com/particles.js/
  - figures géométriques ?
  - fractales
  - https://www.youtube.com/watch?v=f6rK8ZAag9E&list=PL17dHu1NtlTPkxvhcagKgEB9IGeoHz5w6&index=106
  - Source : shader isf
  - Emulateur nes + glitch
- effets
  - incurver l'image comme sur un écran (ou l'inverse)
  - dithering random
  - pixellisation
  - pixel desert
  - trails
