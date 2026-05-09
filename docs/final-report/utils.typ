#import "@local/mardincc-typst:0.1.0": colors

// Typst utilities for the Science-style Stability Paradox essay
#let project(
  title: "", 
  authors: (),
  instructor: "",
  university: "",
  department: "",
  course: "",
  category: "", body) = {
  set document(title: title, author: authors.map(a => a.name))
  let author = if authors.len() > 0 { authors.first() } else { (:) }
  
  // Science uses very tight margins
  set page(
    paper: "a4",
    margin: (x: 1.2cm, top: 1cm, bottom: 1.5cm),
    header: [
      #line(length: 100%, stroke: 0.5pt)
    ],
    footer: [
      #set align(right)
      #set text(size: 8pt)
      #context counter(page).display()
    ]
  )
  
  set text(font: "Linux Libertine", size: 9pt)
  set par(justify: true, leading: 0.55em)
  
  // Title and student-information section (full width)
  grid(
    columns: (1fr),
    gutter: 0.5em,
    {
      {
        set text(fill: rgb(colors.accent-color), weight: "bold", size: 1.05em, font: "Arial", )
        if category != "" {
          upper(category)
        }
        [ --- ]
        if "course" != "" {
          course
        }
      }

      v(-0.5em)
      text(weight: "bold", size: 1.8em, font: "Arial", title)
      v(0.15em)

      v(0.8em)

        [
          #smallcaps("Authors") 

          #for author in authors [
            #text(fill: rgb("666666"))[#author.name (#author.student_id)]
            
          ]
        ]
      grid(
        columns: (6em, 1fr),
        row-gutter: 0.25em,
        column-gutter: 0.8em,
        text(fill: rgb("666666"))[Supervisor], instructor,
        text(fill: rgb("666666"))[University], if "university" != "" { university } else { [] },
        text(fill: rgb("666666"))[Dept], if "department" != "" { department } else { [] },
      )
    }
  )
  
  v(1em)
  
  // Main body in columns with a vertical separator
  
  
  // Horizontal line above body
  body
}

#let columnize(body) = {
  columns(2, gutter: 1.2em)[#body]
} 
#let decolumnize(body) = columns.with(1)[#body]

#let abstract(body) = {
  set text(size: 10pt, fill: colors.accent-color, weight: "bold", font: "Arial")
  smallcaps("Abstract") 
  v(0.1em)
  set text(weight: "bold", fill: black, size: 9pt)
  body
  v(1em)
}

#let chart(path, caption) = {
  v(1em)
  figure(
    image(path, width: 100%),
    caption: caption
  )
  v(1em)
}

#let rq-subtitle(body) = {
  v(-0.1em)
  text(size: 8pt, fill: rgb("666666"), style: "italic", body)
  v(0.1em)
}

// Simple dropcap implementation
#let dropcap(letter, body) = {
  grid(
    columns: (auto, 1fr),
    gutter: 0.3em,
    text(size: 3.5em, weight: "bold", font: "Linux Libertine", letter),
    body
  )
}



#let fig-placeholder(label, note: "") = figure(
  rect(
    width: 100%,
    height: 4.6cm,
    fill: luma(240),
    stroke: 0.8pt + rgb("999999"),
  ),
  caption: [*#label* #if note != "" {[— #note]}],
)


#let gh-purple = rgb("#8250df")
#let gh-green = rgb("#1a7f37")
#let gh-red = rgb("#cf222e")
#let gh-purple-soft = rgb("#fbefff")
#let gh-green-soft = rgb("#dafbe1")
#let gh-red-soft = rgb("#ffebe9")
#let gh-white = rgb("#ffffff")

#let gh-pill(label, fill, fg, stroke-color: none) = box(
  baseline: 0.12em,
  radius: 999pt,
  inset: (x: 5.5pt, y: 3pt),
  fill: fill,
  stroke: if stroke-color == none { none } else { 0.7pt + stroke-color },
)[
  #text(size: 5pt, weight: "bold", fill: fg, font: "JetBrains Mono")[#label]
]

#let pr(num, status: "merged") = {
  if status == "closed" {
    link("https://github.com/Krr0ptioN/cse-220/pull/" + str(num))[
      #gh-pill("Closed PR #" + str(num), gh-red-soft, gh-red, stroke-color: gh-red)
    ]
  } else {
    link("https://github.com/Krr0ptioN/cse-220/pull/" + str(num))[
      #gh-pill("Merged PR #" + str(num), gh-purple, gh-white)
    ]
  }
}

#let issue(num, state: "closed") = {
  if state == "open" {
    link("https://github.com/Krr0ptioN/cse-220/issues/" + str(num))[
      #gh-pill("Open Issue #" + str(num), gh-green-soft, gh-green, stroke-color: gh-green)
    ]
  } else {
    link("https://github.com/Krr0ptioN/cse-220/issues/" + str(num))[
      #gh-pill("Closed Issue #" + str(num), gh-purple-soft, gh-purple, stroke-color: gh-purple)
    ]
  }
}

#let todo(done) = box(
  width: 8pt,
  height: 8pt,
  radius: 1.4pt,
  inset: 0pt,
  fill: if done { gh-purple } else { gh-white },
  stroke: 0.8pt + if done { gh-purple } else { gh-green },
)[
  #if done [
    #align(center + horizon)[
      #text(size: 5.4pt, weight: "bold", fill: gh-white, font: "JetBrains Mono")[✓]
    ]
  ]
]
