import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { benefitList } from '@/lib/benefit-interview'
import type { BenefitCode } from '@/lib/benefit-interview'
import { isFamilyBenefit } from '@/lib/benefit-document-context'
import type { DateRange } from '@/lib/benefit-document-context'
import { formatDocumentDate, shiftDate } from '@/lib/benefit-documents'
import type { DocumentGuide, DocumentOptions } from '@/lib/benefit-documents'
import { cn } from '@/lib/utils'

export function DocumentField({ title, name, children, className }: {
  title: string
  name: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label htmlFor={name} className="leading-snug">{title}</Label>
      {children}
    </div>
  )
}

function downloadDraft(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

type DraftMode = 'benefit' | 'leave'

export function ApplicationDraft({
  benefit, guide, mode, addressee, options, period, rateAvailable,
}: {
  benefit: BenefitCode
  guide: DocumentGuide
  mode: DraftMode
  addressee: string
  options: DocumentOptions
  period?: DateRange
  rateAvailable: boolean
}) {
  const [start, setStart] = useState(period?.start ?? '')
  const [draft, setDraft] = useState('')
  const leave = mode === 'leave' ? guide.leave : undefined
  const beforeBirth = benefit === 'macierzynski' && options.maternityCase === 'before_birth'
  const takesOver = benefit === 'macierzynski' && options.maternityCase === 'takeover'
  const parental = benefit === 'rodzicielski'
  const paternity = benefit === 'ojcowski'
  const supplementary = benefit === 'uzupelniajacy'
  const showChildren = !beforeBirth && isFamilyBenefit(benefit)
  const title = leave ? 'Wniosek o ' + leave.title : 'Dane do formularza ' + guide.form.label

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const get = (name: string) => String(data.get(name) ?? '').trim()
    const applicant = get('draft-name')
    const recipient = get('draft-addressee')
    if (!applicant || !recipient) return
    const children = get('draft-children')
    const notes = get('draft-notes')
    const address = get('draft-address')
    const identifier = get('draft-id')
    const end = get('draft-end')
    const dates = end ? [start, end].map(formatDocumentDate).join(' – ') : 'od ' + formatDocumentDate(start)
    const maternityEnd = get('draft-maternity-end')
    const lines = [
      leave ? 'SZKIC WNIOSKU URLOPOWEGO' : 'SYMULACJA — DANE DO FORMULARZA ZUS',
      '',
      'Wnioskodawca: ' + applicant,
      ...(identifier ? ['PESEL lub dokument tożsamości: ' + identifier] : []),
      ...(address ? ['Adres: ' + address] : []),
      'Adresat: ' + recipient,
      '',
      title,
      leave ? 'Proszę o ' + leave.title + ' w okresie ' + dates + '.' : benefitList[benefit].name + ' — ' + guide.form.label,
      ...(leave ? [] : ['Wnioskowany okres: ' + dates]),
      ...(children ? ['Dane dzieci: ' + children] : []),
      ...(maternityEnd ? ['Koniec macierzyńskiego: ' + formatDocumentDate(maternityEnd)] : []),
      ...(get('draft-rate') ? ['Wnoszę o wypłatę za pełny okres macierzyńskiego i rodzicielskiego według stawki 81,5%, w zakresie przewidzianym w ustawie.'] : []),
      ...(notes ? [notes] : []),
      '',
      'Dokumenty i informacje do sprawdzenia przed złożeniem:',
      ...guide.documents.map((item) => '• ' + item),
      '',
      'Data i podpis: ........................................',
    ]
    setDraft(lines.join('\n'))
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm text-muted-foreground">
        {leave
          ? 'Wypełnij pola i pobierz szkic dla pracodawcy. Dodaj załączniki z listy przed złożeniem.'
          : 'Przygotuj dane do przeniesienia do aktualnego formularza ZUS. W symulacji możesz użyć fikcyjnych danych.'}
      </p>
      <form className="space-y-4" onSubmit={prepare} onChange={() => setDraft('')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <DocumentField name="draft-name" title="Imię i nazwisko wnioskodawcy">
            <Input name="draft-name" id="draft-name" required pattern=".*\S.*" maxLength={120} autoComplete="off" />
          </DocumentField>
          <DocumentField name="draft-addressee" title="Adresat">
            <Input key={addressee} name="draft-addressee" id="draft-addressee" required pattern=".*\S.*" maxLength={180} defaultValue={addressee} />
          </DocumentField>
          {!leave && (
            <>
              <DocumentField name="draft-id" title="PESEL lub numer dokumentu (opcjonalnie w szkicu)">
                <Input name="draft-id" id="draft-id" maxLength={35} autoComplete="off" />
              </DocumentField>
              <DocumentField name="draft-address" title="Adres do wpisania we wniosku">
                <Input name="draft-address" id="draft-address" maxLength={180} autoComplete="off" />
              </DocumentField>
            </>
          )}
          <DocumentField name="draft-start" title="Pierwszy dzień okresu">
            <Input name="draft-start" id="draft-start" type="date" required min="1900-01-01" max="2199-12-31" value={start}
              onChange={(event) => setStart(event.target.value)} />
          </DocumentField>
          {!(leave && beforeBirth) && (
            <DocumentField name="draft-end" title="Ostatni dzień okresu">
              <Input name="draft-end" id="draft-end" type="date" required min={start || '1900-01-01'} max="2199-12-31" defaultValue={period?.end} />
            </DocumentField>
          )}
          {supplementary && (
            <DocumentField name="draft-maternity-end" title="Ostatni dzień macierzyńskiego">
              <Input name="draft-maternity-end" id="draft-maternity-end" type="date" required min="1900-01-01" max="2199-12-31"
                defaultValue={period ? shiftDate(period.start, -1) : undefined} />
            </DocumentField>
          )}
        </div>
        {showChildren && (
          <DocumentField name="draft-children" title="Dane dzieci (imię, nazwisko i data urodzenia)">
            <Input name="draft-children" id="draft-children" required={takesOver || (leave && benefit === 'macierzynski')}
              maxLength={1500} autoComplete="off" />
          </DocumentField>
        )}
        {(parental || takesOver || paternity || supplementary) && (
          <DocumentField name="draft-notes" title={
            parental ? 'Wykorzystane okresy, liczba części i plany drugiego rodzica'
              : takesOver ? 'Okres macierzyńskiego lub zasiłku wykorzystany przed porodem'
                : paternity ? 'Informacja o wcześniej wykorzystanym ojcowskim'
                  : 'Oświadczenie o zamiarach drugiego rodzica'
          }>
            <Input name="draft-notes" id="draft-notes" required={!!leave} maxLength={1500} />
          </DocumentField>
        )}
        {!leave && rateAvailable && (
          <label className="flex items-start gap-2 text-sm">
            <input name="draft-rate" type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary" />
            Uwzględnij wniosek o stawkę 81,5% za pełny okres
          </label>
        )}
        <Button type="submit">Przygotuj podgląd</Button>
      </form>

      {draft && (
        <div className="space-y-3">
          <Label htmlFor="draft-preview">Podgląd szkicu</Label>
          <textarea id="draft-preview" rows={11} readOnly value={draft}
            className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed" />
          <Button type="button" variant="outline" onClick={() => downloadDraft(
            (leave ? 'wniosek-urlopowy-' : 'szkic-' + guide.form.label.toLowerCase() + '-') + benefit + '.txt', draft,
          )}>
            <FileDown aria-hidden="true" /> Pobierz szkic
          </Button>
        </div>
      )}
    </div>
  )
}
